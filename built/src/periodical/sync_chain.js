module.exports = function () {
    if (!K.prev_hash) {
        return l('No K.prev_hash to sync from');
    }
    var sendSync = function () {
        // if we're validator then sync from anyone except us
        var usableSet = me.my_validator
            ? K.validators.filter(function (m) { return m != me.my_validator; })
            : K.validators;
        var randomChosenValidator = usableSet.randomElement();
        //l('Sync from ', randomChosenValidator.location)
        me.send(randomChosenValidator, {
            method: 'requestChain',
            start_block: K.total_blocks,
            limit: parseInt(argv.sync_limit ? argv.sync_limit : K.sync_limit),
            prev_hash: K.prev_hash,
            network_name: K.network_name
        });
    };
    //if (me.my_validator) {
    //  return sendSync()
    //}
    var now = Date.now();
    // is there new block expected & we didn't request for a while
    if (!cached_result.sync_started_at &&
        K.ts + K.blocktime + 2000 < now &&
        me.last_sync_chain + 5000 < now) {
        // await returnChain from now on
        me.last_sync_chain = now;
        return sendSync();
    }
    //l('No need to sync, K.ts is recent')
};
