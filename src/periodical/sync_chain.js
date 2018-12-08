module.exports = () => {
  if (!K.prev_hash) {
    return l('No K.prev_hash to sync from')
  }

  const sendSync = () => {
    // if we're validator then sync from anyone except us
    const usableSet = me.my_validator
      ? Validators.filter((m) => m != me.my_validator)
      : Validators
    const randomChosenValidator = usableSet.randomElement()

    //l('Sync from ', randomChosenValidator.location)

    me.send(randomChosenValidator, {
      method: 'requestChain',
      their_block: K.total_blocks,
      network_name: K.network_name,
      prev_hash: K.prev_hash,
      limit: parseInt(argv.sync_limit ? argv.sync_limit : K.sync_limit)
    })
  }

  //if (me.my_validator) {
  //  return sendSync()
  //}
  let now = ts()
  // is there new block expected & we didn't request for a while
  if (
    !cached_result.sync_started_at &&
    K.ts + K.blocktime + 1000 < now &&
    me.last_sync_chain + 1000 < now
  ) {
    me.last_sync_chain = now
    return sendSync()
  }

  //l('No need to sync, K.ts is recent')
}
