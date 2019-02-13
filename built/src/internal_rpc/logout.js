module.exports = function () {
    //me.intervals.map(clearInterval)
    if (me.external_wss_server) {
        me.external_wss_server.close();
        me.external_wss.clients.forEach(function (c) { return c.close(); });
        // Object.keys(me.sockets).forEach( c=>me.sockets[c].end() )
    }
    me = new Me();
    fatal(1);
    return { pubkey: null };
};
