module.exports = function (i) {
    var methodMap = [
        'placeholder',
        'returnChain',
        'JSON',
        // consensus
        'propose',
        'prevote',
        'precommit',
        // onchain transactions
        'batch',
        // methods below are per-assets (ie should have setAsset directive beforehand)
        'deposit',
        'withdraw',
        'dispute',
        'revealSecrets',
        'vote'
    ];
    if (typeof i === 'string') {
        i = i.trim();
        if (methodMap.indexOf(i) == -1)
            throw "No such method: \"" + i + "\"";
        return methodMap.indexOf(i);
    }
    else {
        return methodMap[i];
    }
};
