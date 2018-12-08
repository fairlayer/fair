const withdraw = require('../offchain/withdraw')

module.exports = async (json) => {
  // perform a specific operation on given channel
  let ch = await Channel.get(json.they_pubkey)
  if (!ch) {
    l('no channel')
    return
  }

  let subch = ch.d.subchannels.by('asset', json.asset)
  if (!subch) {
    l('no subch')
    return false
  }

  //todo: ensure not in a dispute!

  if (json.method == 'withdraw') {
    if (json.amount > ch.derived[json.asset].available) {
      react({alert: 'More than you can withdraw from available'})
      return
    }
    // meanwhile ch has been updated
    ch = await withdraw(ch, subch, json.amount)
    if (!ch) return l('No channel w')

    subch = ch.d.subchannels.by('asset', json.asset)

    if (subch.withdrawal_amount == 0) {
      react({
        alert: 'Failed to get withdrawal. Try later or start a dispute.'
      })
      return
    }
    let withdrawal = [subch.withdrawal_amount, ch.partner, subch.withdrawal_sig]

    l('Adding withdrawal ', withdrawal)

    me.batchAdd('withdraw', [json.asset, withdrawal])
    await subch.save()

    react({confirm: 'OK'})
    return withdrawal
  } else if (json.method == 'deposit') {
    // not used
    me.batchAdd('deposit', [
      json.asset,
      [json.amount, me.record.id, ch.partner, 0]
    ])
    react({confirm: 'OK'})
  } else if (json.method == 'setLimits') {
    subch.credit = json.credit
    subch.rebalance = json.rebalance

    // nothing happened

    await subch.save()

    //l('set limits to ', ch.d.they_pubkey)

    me.send(ch.d.they_pubkey, {
      method: 'setLimits',
      asset: subch.asset,
      credit: subch.credit,
      rebalance: subch.rebalance
    })

    await me.flushChannel(ch.d.they_pubkey, false)

    //react({confirm: 'OK'})
  } else if (json.method == 'requestCredit') {
    me.send(ch.d.they_pubkey, {
      method: 'requestCredit',
      asset: json.asset,
      amount: json.amount
    })
  } else if (json.method == 'requestInsurance') {
    subch.requested_insurance = true
    await subch.save()

    me.send(ch.d.they_pubkey, {method: 'requestInsurance', asset: json.asset})
    //react({confirm: 'Requested insurance, please wait'})
  } else if (json.method == 'testnet') {
    me.send(ch.d.they_pubkey, {
      method: 'testnet',
      action: json.action,
      asset: json.asset,
      amount: json.amount,
      address: me.getAddress()
    })
  }

  return {}
}
