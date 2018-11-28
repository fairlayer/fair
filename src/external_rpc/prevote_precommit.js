module.exports = async (inputType, args) => {
  let [pubkey, sig, body] = args
  let [method, header] = r(body)
  let m = Validators.find((f) => f.block_pubkey.equals(pubkey))

  if (me.status != inputType || !m) {
    l(`${m.id}:${inputType}. in ${me.status}`)
    return //
  }

  if (header.length < 5) {
    l(`${m.id}:${inputType} nil `)
    return //
  }

  if (!me.proposed_block.header) {
    l(`${m.id}:${inputType}. We have no block`)
    return
  }

  if (
    ec.verify(r([methodMap(inputType), me.proposed_block.header]), sig, pubkey)
  ) {
    m[inputType] = sig
    //l(`Received ${inputType} from ${m.id}`)
  } else {
    l(
      `${m.id}:${inputType} doesn't work for our block ${toHex(
        me.proposed_block.header
      )}`
    )
  }
}
