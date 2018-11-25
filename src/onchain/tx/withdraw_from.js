module.exports = async (s, args) => {
  // withdraw money from a channel by providing a sig of your partner
  // you can only withdraw from insured balance
  let asset = readInt(args[0])
  s.parsed_tx.events.push(['setAsset', 'Withdraw', asset])

  for (const withdrawal of args[1]) {
    // how much? with who? their signature
    let [amount, partnerId, withdrawal_sig] = withdrawal

    amount = readInt(amount)

    const partner = await getUserByIdOrKey(partnerId)
    if (!partner || !partner.id) {
      l('Cant withdraw from nonexistent partner')
      return
    }

    const compared = Buffer.compare(s.signer.pubkey, partner.pubkey)
    if (compared == 0) return

    let available = userAsset(partner, asset)

    const ins = await getInsuranceBetween(s.signer, partner)
    let subins = ins.subinsurances.by('asset', asset)
    if (subins) {
      available += subins.balance
    }

    // todo, dont let to withdraw too much native asset

    if (!ins || amount > available) {
      l(`Invalid withdrawal: ${available} but requests ${amount}`)
      return
    }

    const body = r([
      methodMap('withdrawFrom'),
      ins.leftId,
      ins.rightId,
      ins.withdrawal_nonce,
      amount,
      asset
    ])

    if (!ec.verify(body, withdrawal_sig, partner.pubkey)) {
      l(
        'Invalid withdrawal sig by partner ',
        asset,
        ins.withdrawal_nonce,
        amount,
        withdrawal_sig,
        partner.pubkey
      )
      return
    }

    var take_from_insurance = amount
    // not enough in insurance? take the rest from partner's onchain balance
    if (!subins || amount > subins.balance) {
      take_from_insurance = subins ? subins.balance : 0
      let take_from_onchain = amount - take_from_insurance

      userAsset(partner, asset, -take_from_onchain)

      // ondelta must also be modified to represent onchain deduction
      if (partner.id == ins.leftId) {
        subins.ondelta += take_from_onchain
      } else {
        subins.ondelta -= take_from_onchain
      }
    }

    if (take_from_insurance > 0) {
      subins.balance -= take_from_insurance
      // if signer is left and reduces insurance, move ondelta to the left too
      // .====| reduce insurance .==--| reduce ondelta .==|

      if (s.signer.id == ins.leftId) subins.ondelta -= take_from_insurance
    }

    // giving signer amount to their onchain balance
    userAsset(s.signer, asset, amount)

    // preventing double spend with same withdrawal
    ins.withdrawal_nonce++

    await saveId(ins)
    await ins.save()

    // for blockchain explorer
    s.parsed_tx.events.push(['withdrawFrom', amount, partner.id])
    s.meta.inputs_volume += amount // todo: asset-specific

    // was this input related to us?
    if (me.record && [partner.id, s.signer.id].includes(me.record.id)) {
      const ch = await Channel.get(
        me.record.id == partner.id ? s.signer.pubkey : partner.pubkey,
        false
      )
      let subch = ch.d.subchannels.by('asset', asset)

      //l('Updating withdrawal amounts! ', subch)
      // they planned to withdraw and they did. Nullify hold amount
      subch.they_withdrawal_amount = 0

      // already used, nullify
      subch.withdrawal_amount = 0
      subch.withdrawal_sig = null

      ch.ins = ins

      //if (argv.syncdb) ch.d.save()
    }
  }
}
