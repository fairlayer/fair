module.exports = async (pubkey, json, ws) => {
  let [proof_pubkey, sig, body] = r(fromHex(json.proof))
  let [method, header] = r(body)

  let m = Validators.find((f) => f.block_pubkey.equals(proof_pubkey))

  if (me.status != json.method || !m) {
    l(`${m.id}:${json.method}. in ${me.status}`)
    return //
  }

  if (header.length < 5) {
    l(`${m.id}:${json.method} nil `)
    return //
  }

  if (!me.proposed_block) {
    l(`${m.id}:${json.method}.`)
    return
  }

  if (
    ec.verify(
      r([methodMap(json.method), me.proposed_block.header, me.current_round]),
      sig,
      proof_pubkey
    )
  ) {
    m[json.method] = sig
    //l(`Received ${json.method} from ${m.id}`)
  } else {
    l(
      `${m.id}:${json.method} doesn't work for our block ${toHex(
        me.proposed_block.header
      )}`
    )
  }
}
