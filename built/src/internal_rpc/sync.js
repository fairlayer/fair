module.exports = function () {
    Periodical.syncChain();
    return { confirm: 'Syncing the chain...' };
};
