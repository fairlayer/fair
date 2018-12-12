module.exports = async () => {
  me.status = 'propose'
  // this is protection from a prevote replay attack
  me.current_round = Math.floor(ts() / K.blocktime)

  //l('Next round', nextValidator().id)
  if (me.my_validator != nextValidator()) {
    return
  } else {
    //l('Our turn to propose')
  }

  //l(`it's our turn to propose, gossip new block`)
  if (K.ts < ts() - K.blocktime * 3) {
    l('Danger: No previous block exists')
  }

  let header = false
  let ordered_tx_body

  if (me.locked_block) {
    l(`We precommited to previous block, keep proposing it`)
    ;({header, ordered_tx_body} = me.locked_block)
  } else {
    // otherwise build new block from your mempool
    let total_size = 0
    const ordered_tx = []
    const s = {dry_run: true, meta: {}}

    for (const candidate of me.mempool) {
      if (total_size + candidate.length >= K.blocksize) {
        l(`The block is out of space, stop adding tx`)
        break
      }

      // TODO: sort by result.gasprice (optimize for profits)
      const result = await me.processBatch(s, candidate)
      if (result.success) {
        ordered_tx.push(candidate)
        total_size += candidate.length
      } else {
        l(`Bad tx in mempool`, result, candidate)
        // punish submitter ip
      }
    }

    //l(`Mempool ${me.mempool.length} vs ${ordered_tx.length}`)

    // flush it or pass leftovers to next validator
    me.mempool = []

    // Propose no blocks if mempool is empty
    //if (ordered_tx.length > 0 || K.ts < ts() - K.skip_empty_blocks) {
    ordered_tx_body = r(ordered_tx)
    header = r([
      methodMap('propose'),
      me.record.id,
      K.total_blocks,
      Buffer.from(K.prev_hash, 'hex'),
      ts(),
      sha3(ordered_tx_body),
      current_db_hash()
    ])
    //}
  }

  if (!header) {
    l('No header to propose')
    return
  }

  var propose = r([
    bin(me.block_keypair.publicKey),
    bin(ec(header, me.block_keypair.secretKey)),
    header,
    ordered_tx_body
  ])

  if (me.CHEAT_dontpropose) {
    l('CHEAT_dontpropose')
    return
  }

  //l('Gossiping header ', toHex(header))

  setTimeout(() => {
    me.sendAllValidators({method: 'propose', propose: propose})
  }, K.gossip_delay)
}
