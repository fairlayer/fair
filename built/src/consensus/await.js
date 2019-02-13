module.exports = function () {
    me.status = 'await';
    //l('Consensus: ' + me.status + Date.now())
    // if have 2/3+ precommits, commit the block and share
    var shares = 0;
    var precommits = [];
    K.validators.map(function (c, index) {
        if (PK['precommit_' + c.id]) {
            shares += c.shares;
            precommits[index] = PK['precommit_' + c.id];
        }
        else {
            precommits[index] = 0;
        }
        // flush sigs for next round
        delete PK['prevote_' + c.id];
        delete PK['precommit_' + c.id];
    });
    //me.current_round++
    if (shares < K.majority) {
        l("Failed to commit #" + K.total_blocks + ", " + shares + "/" + K.majority, K.total_blocks);
        // go sync immediately, went out of sync?
        //Periodical.syncChain()
    }
    else if (me.proposed_block.header) {
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
        ]);
        //me.current_round = 0
    }
    me.proposed_block = null;
};
