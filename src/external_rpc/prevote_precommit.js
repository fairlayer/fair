module.exports = async (inputType, args) => {
  let [pubkey, sig, body] = args
  let [method, header] = r(body)
  let m = Validators.find((f) => f.block_pubkey.equals(pubkey))

  if (me.status != inputType || !m) {
    l(`${me.status} not ${inputType}`)
    return //
  }

  if (header.length < 5) {
    l(`${m.id} voted nil`)
    return //
  }

  if (!me.proposed_block.header) {
    l('We have no block')
    return
  }

  if (
    ec.verify(r([methodMap(inputType), me.proposed_block.header]), sig, pubkey)
  ) {
    m[inputType] = sig
    //l(`Received ${inputType} from ${m.id}`)
  } else {
    l(
      `This ${inputType} by ${m.id} doesn't work for our block ${toHex(
        me.proposed_block.header
      )}`
    )
  }
}
