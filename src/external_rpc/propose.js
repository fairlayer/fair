module.exports = async (pubkey, json, ws) => {
  let [pubkey_propose, sig, header, ordered_tx_body] = r(fromHex(json.propose))
  let m = K.validators.find((f) => f.block_pubkey.equals(pubkey_propose))

  if (me.status != 'propose' || !m) {
    return l(`${me.status} not propose`)
  }

  if (header.length < 5) {
    return l(`${m.id} voted nil`)
  }

  // ensure the proposer is the current one
  let proposer = nextValidator()
  if (m != proposer) {
    return l(`You ${m.id} are not the current proposer ${proposer.id}`)
  }

  if (!ec.verify(header, sig, pubkey_propose)) {
    return l('Invalid proposer sig')
  }

  if (PK.locked_block && PK.locked_block.header.equals(header)) {
    me.proposed_block = PK.locked_block

    l(`Proposed our locked ${toHex(me.proposed_block.header)}`)
    return
  }

  // no precommits means dry run
  if (
    !(await me.processBlock({
      header: header,
      ordered_tx_body: ordered_tx_body,
      dry_run: true
    }))
  ) {
    l(`Bad block proposed ${toHex(header)}`)
    return false
  }

  // consensus operations are in-memory for now
  //l('Saving proposed block')
  me.proposed_block = {
    proposer: pubkey_propose,
    sig: sig,

    header: bin(header),
    ordered_tx_body: ordered_tx_body
  }
}
