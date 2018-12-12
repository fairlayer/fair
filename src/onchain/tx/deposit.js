module.exports = async (s, args) => {
  // deposit from our onchain balance to another onchain balance or channel from some side
  let asset = readInt(args[0])

  s.parsed_tx.events.push(['setAsset', 'Deposit', asset])

  await userPayDebts(s.signer, asset, s.parsed_tx)

  // there's a tiny bias here, the bank always gets reimbursed more than fee paid
  // todo: consider splitting txfee based on % in total output volume
  // const reimburse_txfee = 1 + Math.floor(s.parsed_tx.txfee / args.length)

  for (let output of args[1]) {
    let amount = readInt(output[0])
    let original_amount = amount

    let signer_has = userAsset(s.signer, asset)

    if (amount > signer_has) {
      l(`${s.signer.id} Trying to deposit ${amount} but has ${signer_has}`)
      return
    }

    const target = await getUserByIdOrKey(output[1])
    if (!target) return

    const withPartner =
      output[2].length == 0 ? false : await getUserByIdOrKey(output[2])

    // here we ensure both parties are registred (have id), and take needed fees
    if (!target.id) {
      // you must be registered first using asset 1
      if (asset != 1) {
        l('Not 1 asset')
        return
      }

      if (!withPartner) {
        if (amount < K.account_creation_fee) return

        userAsset(target, asset, amount - K.account_creation_fee)
        userAsset(s.signer, asset, -amount)

        if (me.is_me(target.pubkey)) {
          me.addEvent({
            type: 'fee',
            amount: -K.account_creation_fee,
            asset: asset,

            desc: `Paid account creation fee`
          })
        }
      } else {
        if (!withPartner.id) {
          l("Both partners don't exist")
          return
        }
        // todo: support usecase of paying to new account @bank
        throw 'yolo'

        const fee = K.standalone_balance + K.account_creation_fee
        if (amount < fee) return

        userAsset(target, asset, K.standalone_balance)
        amount -= fee
        //userAsset(s.signer, asset, -fee)
      }

      await saveId(target)

      K.collected_fees += K.account_creation_fee
    } else {
      if (withPartner) {
        if (!withPartner.id) {
          // the partner is not registred yet

          let fee = K.standalone_balance + K.account_creation_fee
          if (amount < fee) return
          if (asset != 1) {
            l('Not 1 asset')
            return
          }

          userAsset(withPartner, asset, K.standalone_balance)
          amount -= fee
          //userAsset(s.signer, asset, -fee)
          await withPartner.save()
          // now it has id

          /*
          if (me.is_me(withPartner.pubkey)) {
            await me.addHistory(
              target.pubkey,
              -K.account_creation_fee,
              'Account creation fee'
            )
            await me.addHistory(
              target.pubkey,
              -K.standalone_balance,
              'Minimum global balance'
            )
          }
          */
        }
      } else {
        if (target.id == s.signer.id) {
          l('Trying to deposit to your onchain balance is pointless')
          return
        }
        userAsset(target, asset, amount)
        //l('Deposited now: ', target)
        userAsset(s.signer, asset, -amount)
        await saveId(target)
      }
    }

    if (withPartner && withPartner.id) {
      const compared = Buffer.compare(target.pubkey, withPartner.pubkey)
      if (compared == 0) return

      const ins = await getInsuranceBetween(target, withPartner)

      let subins = ins.subinsurances.by('asset', asset)
      if (!subins) {
        subins = Subinsurance.build({
          insuranceId: ins.id,
          asset: asset
        })
        ins.subinsurances.push(subins)
      }

      subins.balance += amount
      if (target.id == ins.leftId) subins.ondelta += amount

      // user is paying themselves for registration
      const regfees = original_amount - amount
      subins.ondelta -= compared * regfees

      userAsset(s.signer, asset, -amount)

      if (K.banks.find((h) => h.id == s.signer.id)) {
        // The bank gets reimbursed for rebalancing users.
        // Otherwise it would be harder to collect fee from participants
        // TODO: attack vector, the user may not endorsed this rebalance
        // reimbures to bank rebalance fees
        /*
        subins.balance -= reimburse_txfee
        subins.ondelta -= compared * reimburse_txfee
        userAsset(s.signer, 1, reimburse_txfee)
        */
        // todo take from onchain balance instead
      }

      await saveId(ins)
      //await ins.save()

      //await saveId(subins)

      if (me.is_me(target.pubkey) || me.is_me(withPartner.pubkey)) {
        // hot reload
        // todo ensure it's in memory yet
        const ch = await Channel.get(
          me.is_me(withPartner.pubkey) ? target.pubkey : withPartner.pubkey
        )

        // rebalance happened, nullify
        let subch = ch.d.subchannels.by('asset', asset)
        subch.requested_insurance = false
        await subch.save()
      }

      // rebalance by bank for our account = reimburse bank fees
      /*
      if (me.is_me(withPartner.pubkey)) {
        await me.addHistory(
          target.pubkey,
          -reimburse_txfee,
          'Rebalance fee',
          true
        )
      }
      */
    }

    // invoice is an arbitrary tag to identify the payer for merchant
    const public_invoice =
      output[3] && output[3].length != 0 ? output[3] : false

    // we sent onchain
    if (me.is_me(s.signer.pubkey)) {
      me.record = s.signer

      me.addEvent({
        type: 'sent',
        amount: -amount,
        asset: asset,
        public_invoice: public_invoice.toString(),
        userId: target.id,

        desc: `Sent to ${target.id}`
      })
    }

    // sent onchain to us
    if (me.is_me(target.pubkey)) {
      //me.record = target

      // TODO: hook into SDK
      me.addEvent({
        type: 'received',
        amount: amount,
        asset: asset,
        public_invoice: public_invoice.toString(),
        userId: s.signer.id,

        desc: `Received from ${s.signer.id}`
      })
    }

    s.parsed_tx.events.push([
      'deposit',
      amount,
      target.id,
      withPartner ? withPartner.id : false,
      public_invoice ? toHex(public_invoice) : false
    ])

    s.meta.outputs_volume += amount
  }
}
