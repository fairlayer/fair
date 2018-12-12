// chain has blocks, block has batches, batch has transactions

module.exports = async (args) => {
  return await section('onchain', async () => {
    //l('Start process chain')

    if (argv.nocrypto) {
      var original_state = await onchain_state()
    }

    let end = perf('processChain')
    //l(`Sync since ${cached_result.sync_started_at} ${args.length}`)

    // step 1: ensure entire chain is cross-linked with prev_hash
    // we don't check precommits yet

    let our_prev_hash = fromHex(K.prev_hash)
    for (const block of args) {
      // cast all rounds to integer
      if (typeof block[0] != 'number') {
        block[0] = readInt(block[0])
      }

      // parse header
      let [
        methodId,
        built_by,
        total_blocks,
        prev_hash,
        timestamp,
        tx_root,
        db_hash
      ] = r(block[2])

      if (prev_hash.equals(our_prev_hash)) {
        // hash of next header
        our_prev_hash = sha3(block[2])
      } else {
        l(`Outdated chain: ${K.total_blocks} ${readInt(total_blocks)}`)
        return
      }
    }

    // s means state (like ENV) - it is passed down to block, batch and every tx
    var s = {
      missed_validators: [],
      dry_run: false
    }

    // // step 2: last block has valid precommits (no need to check sigs on each block)
    let last_block = args[args.length - 1]

    let shares = 0
    let precommits = last_block[1]

    let precommit_body = [methodMap('precommit'), last_block[2], last_block[0]]

    for (let i = 0; i < Validators.length; i++) {
      if (
        precommits[i] &&
        precommits[i].length == 64 &&
        ec.verify(r(precommit_body), precommits[i], Validators[i].block_pubkey)
      ) {
        shares += Validators[i].shares
      } else {
        s.missed_validators.push(Validators[i].id)
      }
    }

    if (shares < K.majority) {
      return l(`Not enough precommits on entire chain: ${shares} `, args)
    }

    if (!cached_result.sync_started_at) {
      cached_result.sync_started_at = K.total_blocks
      cached_result.sync_tx_started_at = K.total_tx
      cached_result.sync_progress = 0
      var startHrtime = hrtime()
    }

    // step 3: if entire chain is precommited, process blocks one by one
    for (const block of args) {
      s.round = block[0]
      s.precommits = block[1]
      s.header = block[2]
      s.ordered_tx_body = block[3]

      if (!(await me.processBlock(s))) {
        l('Bad chain?')
        break
      }

      if (argv.nocrypto) {
        if (K.total_blocks >= parseInt(argv.stop_blocks)) {
          // show current state hash and quit
          let final_state = await onchain_state()

          let msg = {
            original: trim(original_state, 8),
            total_blocks: K.total_blocks,
            final: trim(final_state, 8),
            benchmark: ((hrtime() - startHrtime) / 1000000).toFixed(6)
          }

          Raven.captureMessage('SyncDone', {
            level: 'info',
            extra: msg,
            tags: msg
          })

          l('Result: ' + (msg.final == 'b84905fe'))

          setTimeout(() => {
            fatal('done')
          }, 1000)

          return
        }
      }
    }

    end()

    cached_result.sync_started_at = false
    cached_result.sync_tx_started_at = false

    react({})

    // Ensure our last broadcasted batch was added
    if (PK.pendingBatchHex) {
      const raw = fromHex(PK.pendingBatchHex)
      if (trace) l('Rebroadcasting pending tx ', raw.length)
      react({
        alert: 'Rebroadcasting...',
        force: true
      })

      me.send(nextValidator(true), {method: 'add_batch', data: r([raw])})
      return
    }

    // time to broadcast our next batch then. (Delay to ensure validator processed the block)
    /*
    if (me.my_bank) {
      setTimeout(() => {
        Periodical.broadcast()
      }, 2000)
    }
    */
  })
}
