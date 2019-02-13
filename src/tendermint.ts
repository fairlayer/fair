const compute_phase = () => {
  const second = Date.now() % K.blocktime
  if (second < K.step_latency) {
    return 'propose'
  } else if (second < K.step_latency * 2) {
    return 'prevote'
  } else if (second < K.step_latency * 3) {
    return 'precommit'
  } else {
    return 'await'
  }
}

module.exports = async () => {
  await section('onchain', async () => {
    const phase = compute_phase()

    if (me.status == 'await' && phase == 'propose') {

      me.status = 'propose'

      let epoch = (i) => Math.floor(i / K.blocktime)
      // this is protection from a prevote replay attack
      me.current_round = epoch(Date.now()) - epoch(K.ts) - 1
    
      //l('Next round', nextValidator().id)
      if (me.my_validator != nextValidator()) {
        return
      } else {
        //l('Our turn to propose')
      }
    
      //l(`it's our turn to propose, gossip new block`)
      if (K.ts < Date.now() - K.blocktime * 3) {
        l('Danger: No previous block exists')
      }
    
      let header = false
      let ordered_tx_body
    
      if (PK.locked_block) {
        l(`We precommited to previous block, keep proposing it`)
        ;({header, ordered_tx_body} = PK.locked_block)
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
        //if (ordered_tx.length > 0 || K.ts < Date.now() - K.skip_empty_blocks) {
        ordered_tx_body = r(ordered_tx)
        header = r([
          methodMap('propose'),
          me.record.id,
          K.total_blocks,
          Buffer.from(K.prev_hash, 'hex'),
          Date.now(),
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

    } else if (me.status == 'propose' && phase == 'prevote') {
      me.status = 'prevote'

      // gossip your prevotes for block or nil
      const proof = me.block_envelope(
        methodMap('prevote'),
        me.proposed_block ? me.proposed_block.header : 0,
        me.current_round
      )
    
      setTimeout(() => {
        me.sendAllValidators({
          method: 'prevote',
          proof: proof
        })
      }, K.gossip_delay)
    } else if (me.status == 'prevote' && phase == 'precommit') {
      me.status = 'precommit'

      // gossip your precommits if have 2/3+ prevotes or nil
    
      // do we have enough prevotes?
      let shares = 0
      K.validators.map((c, index) => {
        if (PK['prevote_' + c.id]) {
          shares += c.shares
        }
      })
    
      // lock on this block. Unlock only if another block gets 2/3+
      if (shares >= K.majority) {
        PK.locked_block = me.proposed_block
      }
    
      let proof = me.block_envelope(
        methodMap('precommit'),
        PK.locked_block ? PK.locked_block.header : 0,
        me.current_round
      )
    
      if (me.CHEAT_dontprecommit) {
        l('We are in CHEAT and dont precommit ever')
        return
      }
    
      setTimeout(() => {
        me.sendAllValidators({
          method: 'precommit',
          proof: proof
        })
      }, K.gossip_delay)
    } else if (me.status == 'precommit' && phase == 'await') {
      me.status = 'await'
    
      // if have 2/3+ precommits, commit the block and share
      let shares = 0
      const precommits = []
      K.validators.map((c, index) => {
        if (PK['precommit_' + c.id]) {
          shares += c.shares
          precommits[index] = PK['precommit_' + c.id]
        } else {
          precommits[index] = 0
        }
    
        // flush sigs for next round
        delete PK['prevote_' + c.id]
        delete PK['precommit_' + c.id]
      })
    
      //me.current_round++
    
      if (shares < K.majority) {
        l(
          `Failed to commit #${K.total_blocks}, ${shares}/${K.majority}`,
          K.total_blocks
        )
    
        // go sync immediately, went out of sync?
        //Periodical.syncChain()
      } else if (me.proposed_block.header) {
        //l('Commit block')
        // adding to our external queue to avoid race conditions
        // we don't call processBlock directly to avoid races
        me.processChain([
          [
            me.current_round,
            precommits,
            me.proposed_block.header,
            me.proposed_block.ordered_tx_body
          ]
        ])
        //me.current_round = 0
      }
    
      me.proposed_block = null

    }
  })
  return true
}