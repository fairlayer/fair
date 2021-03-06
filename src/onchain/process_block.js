// Block processing code. Verifies precommits sigs then executes tx in it one by one
module.exports = async (s) => {
  if (s.header.length < 64 || s.header.length > 200) {
    return l(
      'Invalid header length: ',
      s.precommits,
      s.header,
      s.ordered_tx_body
    )
  }

  if (s.ordered_tx_body.length > K.blocksize) {
    return l('Too long block')
  }

  var all = []

  let [
    methodId,
    built_by,
    total_blocks,
    prev_hash,
    timestamp,
    tx_root,
    db_hash
  ] = r(s.header)

  total_blocks = readInt(total_blocks)
  timestamp = readInt(timestamp)
  built_by = readInt(built_by)
  prev_hash = toHex(prev_hash)

  s.proposer = await User.findById(built_by, {include: [Balance]})

  if (!s.proposer) {
    l(`This user doesnt exist ${built_by}`)
    return false
  }

  if (K.prev_hash != prev_hash) {
    l(
      `Must be based on ${K.prev_hash} ${
        K.total_blocks
      } but is using ${prev_hash} ${total_blocks}`
    )
    return false
  }

  if (readInt(methodId) != methodMap('propose')) {
    return l('Wrong method for block')
  }

  if (timestamp < K.ts) {
    return l('New block older than current block')
  }

  if (timestamp > ts() + 60000) {
    return l('Block from far future')
  }

  if (!sha3(s.ordered_tx_body).equals(tx_root)) {
    return l('Invalid tx_root')
  }

  if (!db_hash.equals(current_db_hash())) {
    l('DANGER: state mismatch. Some tx was not deterministic')
  }

  if (s.dry_run) {
    // this is just dry run during consensus
    var clock_skew = ts() - timestamp
    if (clock_skew > 60000 || clock_skew < -60000) {
      l('Timestamp skew is outside range')
      return
    }

    return true
  }

  // List of events/metadata about current block, used on Explorer page
  s.meta = {
    inputs_volume: 0,
    outputs_volume: 0,
    parsed_tx: [],
    cron: [],
    proposer: s.proposer
  }

  // >>> Given block is considered valid and final after this point <<<

  let ordered_tx = r(s.ordered_tx_body)

  K.ts = timestamp

  // increment current block number
  K.total_blocks++

  // Processing transactions one by one
  // Long term TODO: parallel execution with section() critical sections
  for (let i = 0; i < ordered_tx.length; i++) {
    let end = perf('processBatch')
    let result = await me.processBatch(s, ordered_tx[i])
    if (!result.success) l(result)
    end()
  }

  K.prev_hash = toHex(sha3(s.header))

  if (K.total_blocks % 100 == 0 && cached_result.sync_started_at) {
    l(
      `${base_port}: Block ${K.total_blocks} by ${built_by}. tx: ${
        ordered_tx.length
      }`
    )

    // update browser UI about sync process
    cached_result.synced_blocks = K.total_blocks - cached_result.sync_started_at
    let sync_left = Math.round((ts() - K.ts) / K.blocktime)
    cached_result.sync_progress = Math.round(
      (cached_result.synced_blocks /
        (cached_result.synced_blocks + sync_left)) *
        100
    )

    // moves loader animation faster
    react({public: true})
  }

  // todo: define what is considered a "usable" block
  if (s.ordered_tx_body.length < K.blocksize - 10000) {
    K.usable_blocks++
    var is_usable = true
  } else {
    var is_usable = false
  }

  K.total_tx += ordered_tx.length
  K.total_bytes += s.ordered_tx_body.length
  K.blocks_since_last_snapshot += 1

  // When "tail" gets too long, create new snapshot
  if (K.blocks_since_last_snapshot >= K.snapshot_after_blocks) {
    K.blocks_since_last_snapshot = 0
    K.snapshots_taken++

    s.meta.cron.push(['snapshot', K.total_blocks])
    var old_height = K.last_snapshot_height
    K.last_snapshot_height = K.total_blocks
  }

  // >>> Automatic crontab-like tasks <<<
  // Note that different tasks have different timeouts

  if (is_usable && K.usable_blocks % 2 == 0) {
    // Auto resolving disputes that are due

    all.push(
      Insurance.findAll({
        where: {dispute_delayed: {[Op.lte]: K.usable_blocks}},
        include: [Subinsurance]
      }).then(async (insurances) => {
        for (let ins of insurances) {
          s.meta.cron.push(['resolved', ins, await insuranceResolve(ins)])
        }
      })
    )
  }

  if (is_usable && K.usable_blocks % 200 == 0) {
    // Executing smart updates that are due
    let jobs = await Proposal.findAll({
      where: {delayed: {[Op.lte]: K.usable_blocks}},
      include: {all: true}
    })

    for (let job of jobs) {
      var approved = 0
      for (let v of job.voters) {
        var voter = K.validators.find((m) => m.id == v.id)
        if (v.vote.approval && voter) {
          approved += voter.shares
        } else {
          // TODO: denied? slash some votes?
        }
      }

      if (approved >= K.majority) {
        await job.execute()
        s.meta.cron.push(['executed', job.desc, job.code, job.patch])
      }

      await job.destroy()
    }
  }

  if (is_usable && K.usable_blocks % 200 == 0) {
    // we don't want onchain db to be bloated with revealed hashlocks forever, so destroy them
    all.push(
      Hashlock.destroy({
        where: {
          delete_at: {[Op.lte]: K.usable_blocks}
        }
      })
    )
  }

  /*
  if (K.bet_maturity && K.ts > K.bet_maturity) {
    l('🎉 Maturity day! Copy all FRB balances to FRD')
    s.meta.cron.push(['maturity'])

    // first assignment must happen before zeroing
    await onchainDB.db.query('UPDATE users SET balance1 = balance1 + balance2')
    await onchainDB.db.query('UPDATE users SET balance2 = 0')
    //await sequelize.query("UPDATE users SET ")
    //User.update({ balance1: sequelize.literal('balance1 + balance2'), balance2: 0 }, {where: {id: {[Op.gt]: 0}}})

    K.bet_maturity = false
  }
  */

  // saving current proposer and their fees earned
  all.push(s.meta.proposer.save())

  await Promise.all(all)

  if (K.total_blocks % 50 == 0) {
    //var out = child_process.execSync(`shasum -a 256 ${datadir}/onchain/db*`).toString().split(/[ \n]/)
    //K.current_db_hash = out[0]
  }

  // save final block in offchain history db
  // Required for validators/banks, optional for everyone else (aka "pruning" mode)
  // it is fine to delete a block after grace period ~3 months.
  if (me.my_validator || PK.explorer) {
    s.meta.missed_validators = s.missed_validators

    //l('Saving block ' + K.total_blocks)
    await Block.create({
      id: K.total_blocks,

      prev_hash: fromHex(prev_hash),
      hash: sha3(s.header),

      round: s.round,
      precommits: r(s.precommits), // pack them in rlp for storage
      header: s.header,
      ordered_tx_body: s.ordered_tx_body,

      total_tx: ordered_tx.length,

      // did anything happen in this block?
      meta:
        s.meta.parsed_tx.length +
          s.meta.cron.length +
          s.meta.missed_validators.length >
        0
          ? JSON.stringify(s.meta)
          : null
    })
  }

  // Other validators managed to commit a block, therefore delete lock and proceed
  // Tendermint uses 2/3+ prevotes as "proof of lock change"
  if (PK.locked_block) {
    //l('Unlocked at ' + K.total_blocks)
    PK.locked_block = null
    me.proposed_block = null
  }

  // only validators do snapshots, as they require extra computations
  if (
    me.my_validator &&
    me.my_validator.id == 1 &&
    K.blocks_since_last_snapshot == 0
  ) {
    //await promise_writeFile(datadir + '/onchain/k.json', stringify(K))

    /*
    if (me.my_validator.id != 1) {
      // in dev mode only to prevent race for /data
      //await sleep(K.blocktime)
    } else {
      // it's important to flush current K to disk before snapshot
    }
    */

    const path_filter = (path, stat) => {
      // must be deterministic
      stat.mtime = null
      stat.atime = null
      stat.ctime = null
      stat.birthtime = null

      // Skip all test data dirs, our offchain db, tools and irrelevant things for the user
      // No dotfiles. TODO whitelist

      if (
        path.includes('/.') ||
        path.match(
          /^\.\/(isolate|data[0-9]+|data\/offchain|\.DS_Store|node_modules|wiki|wallet\/node_modules|dist|tools)/
        )
      ) {
        return false
      } else {
        return true
      }
    }

    const filename = 'Fair-' + K.total_blocks + '.tar.gz'

    const options = {
      gzip: true,
      sync: false,
      portable: true,
      noMtime: true,
      file: datadir + '/offchain/' + filename,
      filter: path_filter
    }

    const paths = ['.']

    const callback = (_) => {
      // genesis state is stored for analytics and my_validator bootstraping
      if (old_height > 1) {
        // delay to let people with slow connection to finish download
        setTimeout(() => {
          fs.unlink(
            datadir + '/offchain/Fair-' + old_height + '.tar.gz',
            () => {
              l('Removed old snapshot ' + old_height)
            }
          )

          // link to latest snapshot
          child_process.execSync(
            `ln -sf ${datadir}/offchain/${filename}  ${datadir}/offchain/Fair-latest.tar.gz`
          )
        }, 20 * 60 * 1000)
      }
      snapshotHash()
    }

    require('tar').c(options, paths, callback)
  }

  if (me.request_reload) {
    gracefulExit('reload requested')
  }

  return true
}
