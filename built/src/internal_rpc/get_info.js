module.exports = function () {
    // returns generic info about current account and the network
    var result = {
        address: me.getAddress(),
        assets: cached_result.assets //await Asset.findAll()
    };
    return result;
};
