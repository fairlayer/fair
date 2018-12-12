module.exports = async (pubkey, json, ws) => {
  let [pubkey_propose, sig, header, ordered_tx_body] = r(fromHex(json.propose))
  let m = Validators.find((f) => f.block_pubkey.equals(pubkey_propose))

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

  let parsed_header = r(header)

  // this is protection from a replay attack

  let new_ts = readInt(parsed_header[4])
  let theirs = Math.round(new_ts / K.blocktime)
  let ours = Math.round(ts() / K.blocktime)

  if (theirs != ours) {
    return l(`Bad round ${theirs} not ${ours}`)
  }

  if (me.proposed_block.locked) {
    let old_parsed_header = r(me.proposed_block.header)
    old_parsed_header[4] = new_ts
    me.proposed_block.header = r(old_parsed_header)
    header = me.proposed_block.header

    me.proposed_block.uptodate = true

    /*
    return */

    l(`Still locked: ${toHex(me.proposed_block.header)} ${toHex(header)}`)
    return
  }

  // no precommits means dry run
  if (!(await me.processBlock({dry_run: true}, header, ordered_tx_body))) {
    l(`Bad block proposed ${toHex(header)}`)
    return false
  }

  // consensus operations are in-memory for now
  //l('Saving proposed block')
  me.proposed_block = {
    proposer: pubkey_propose,
    sig: sig,

    uptodate: true,
    locked: false,

    header: bin(header),
    ordered_tx_body: ordered_tx_body
  }
}
