module.exports = async (dep) => {
  if (dep.userId) {
    var userId = dep.userId
  } else if (dep.address && dep.address.length > 0) {
    var addr = await parseAddress(dep.address)

    let user = await User.findOne({where: {pubkey: addr.pubkey}})
    var userId = user ? user.id : addr.pubkey
  }

  let amount = parseInt(dep.amount)

  if (amount > 0) {
    let public_invoice = 0
    if (addr && addr.invoice) {
      public_invoice = bin(addr.invoice)
    }
    if (dep.public_invoice) {
      public_invoice = Buffer.from(dep.public_invoice, 'hex')
    }

    let newDeposit = [
      dep.asset,
      [amount, userId, parseInt(dep.hub), public_invoice]
    ]

    l('Adding to queue a deposit ', newDeposit)

    me.batchAdd('deposit', newDeposit)
  }

  return {}
}
