module.exports = async (args) => {
  //todo: ensure no conflicts happen if two parties withdraw from each other at the same time
  let [pubkey, sig, body] = args

  let [amount, asset] = r(body).map(readInt)

  let ch = await Channel.get(pubkey, asset)

  let withdrawal = [
    methodMap('withdrawFrom'),
    ch.ins.leftId,
    ch.ins.rightId,
    ch.ins.withdrawal_nonce,
    amount,
    ch.d.asset
  ]

  if (!ec.verify(r(withdrawal), sig, pubkey)) {
    l('Invalid withdrawal ', withdrawal)
    return false
  }

  l('Got withdrawal for ' + amount)
  ch.d.withdrawal_amount = amount
  ch.d.withdrawal_sig = sig

  if (me.withdrawalRequests[ch]) {
    me.withdrawalRequests[ch](ch)
  }

  if (argv.syncdb) ch.d.save()
}
