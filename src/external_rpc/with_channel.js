module.exports = async (pubkey, json, ws) => {
  //todo: ensure no conflicts happen if two parties withdraw from each other at the same time

  await section(['use', pubkey], async () => {
    let ch = await Channel.get(pubkey)

    if (json.method == 'setLimits') {
      let subch = ch.d.subchannels.by('asset', json.asset)

      subch.they_credit = json.credit
      subch.they_rebalance = json.rebalance
      await subch.save()

      me.textMessage(ch.d.they_pubkey, 'Updated credit limits')
    } else if (json.method == 'requestCredit') {
      let subch = ch.d.subchannels.by('asset', json.asset)

      subch.credit = 100000

      me.send(ch.d.they_pubkey, {
        method: 'setLimits',
        asset: json.asset,
        credit: subch.credit
      })

      await subch.save()

      // forced flush, gives them sig
      await me.flushChannel(pubkey, false)

      me.textMessage(
        ch.d.they_pubkey,
        'Congrats, we opened a credit line for you'
      )
    } else if (json.method == 'requestInsurance') {
      let subch = ch.d.subchannels.by('asset', json.asset)
      subch.they_requested_insurance = true
      await subch.save()

      me.textMessage(ch.d.they_pubkey, 'Added to rebalance queue')
    } else if (json.method == 'giveWithdrawal') {
      let asset = parseInt(json.asset)
      let amount = parseInt(json.amount)
      let withdrawal_sig = fromHex(json.withdrawal_sig)

      /*
      if (!ch.ins) {
        me.textMessage(
          ch.d.they_pubkey,
          'You must be registered'
        )
        return
      }
      */

      let subch = ch.d.subchannels.by('asset', asset)

      let they = await User.findOne({
        where: {pubkey: ch.d.they_pubkey},
        include: [Balance]
      })
      if (!they || !me.record) return l('no pair ', they, me.record)

      let pair = [they.id, me.record.id]
      if (ch.d.isLeft()) pair.reverse()

      let withdrawal = [
        methodMap('withdraw'),
        pair[0],
        pair[1],
        ch.ins ? ch.ins.withdrawal_nonce : 0,
        amount,
        asset
      ]

      if (!ec.verify(r(withdrawal), withdrawal_sig, pubkey)) {
        l('Invalid withdrawal given', withdrawal)
        return false
      }

      l('Got withdrawal for ' + amount)
      subch.withdrawal_amount = amount
      subch.withdrawal_sig = withdrawal_sig
      await subch.save()

      if (me.withdrawalRequests[subch.id]) {
        // returning ch back to requesting function
        me.withdrawalRequests[subch.id](ch)
      }
    } else if (json.method == 'requestWithdrawal') {
      if (me.CHEAT_dontwithdraw) {
        // if we dont give withdrawal or are offline for too long, the partner starts dispute
        return l('CHEAT_dontwithdraw')
      }

      if (ch.d.status != 'master') {
        return l('only return withdrawal to master status')
      }

      if (!ch.ins) {
        me.textMessage(ch.d.they_pubkey, 'You must be registered')
        return
      }

      let subch = ch.d.subchannels.by('asset', json.asset)
      let amount = parseInt(json.amount)
      let asset = parseInt(json.asset)
      let available =
        ch.derived[asset].they_insured + userAsset(me.record, asset)

      if (amount > available) {
        me.textMessage(
          ch.d.they_pubkey,
          `Sorry, you can only withdraw up to ${available}`
        )
        return false
      }

      if (amount == 0 || amount > ch.derived[asset].they_available) {
        l(
          `Partner asks for ${amount} but owns ${
            ch.derived[asset].they_available
          }`
        )
        return false
      }

      if (amount > subch.they_withdrawal_amount) {
        // only keep the highest amount we signed on
        subch.they_withdrawal_amount = amount
      }

      let withdrawal = r([
        methodMap('withdraw'),
        ch.ins.leftId,
        ch.ins.rightId,
        ch.ins.withdrawal_nonce,
        amount,
        asset
      ])

      await subch.save()

      me.send(pubkey, {
        method: 'giveWithdrawal',
        withdrawal_sig: ec(withdrawal, me.id.secretKey),
        amount: amount,
        asset: asset
      })
    } else if (json.method == 'testnet') {
      if (json.action == 'faucet') {
        var friendly_invoice = [
          'You are welcome!',
          'Demo',
          "It's free money!",
          '\'"><'
        ].randomElement()

        let pay = {
          address: json.address,
          amount: json.amount,
          private_invoice: friendly_invoice,
          asset: json.asset
        }

        await me.payChannel(pay)
      }
    }
  })

  if (json.method == 'update') {
    //l(msg.length, ' from ', trim(pubkey), toHex(sha3(msg)))

    // ackSig defines the sig of last known state between two parties.
    // then each transitions contains an action and an ackSig after action is committed
    let flushable = await section(['use', pubkey], async () => {
      //loff(`--- Start update ${trim(pubkey)} - ${transitions.length}`)
      return me.updateChannel(
        pubkey,
        r(fromHex(json.ackState)),
        fromHex(json.ackSig),
        json.transitions,
        json.signedState
      )
    })

    /*
  We MUST ack if there were any transitions, otherwise if it was ack w/o transitions
  to ourselves then do an opportunistic flush (flush if any). Forced ack here would lead to recursive ack pingpong!
  Flushable are other channels that were impacted by this update
  Sometimes sender is already included in flushable, so don't flush twice
  */

    let flushed = [me.flushChannel(pubkey, json.transitions.length == 0)]

    if (flushable) {
      for (let fl of flushable) {
        // can be opportunistic also
        if (!fl.equals(pubkey)) {
          flushed.push(me.flushChannel(fl, true))
        } else {
          //loff('Tried to flush twice')
        }
      }
    }
    await Promise.all(flushed)

    // use lazy react for external requests
    react({private: true})
  }
}
