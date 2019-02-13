module.exports = function () {
    me.status = 'prevote';
    // gossip your prevotes for block or nil
    var proof = me.block_envelope(methodMap('prevote'), me.proposed_block ? me.proposed_block.header : 0, me.current_round);
    setTimeout(function () {
        me.sendAllValidators({
            method: 'prevote',
            proof: proof
        });
    }, K.gossip_delay);
};
