module.exports = (i) => {
    const methodMap = [
        'placeholder',
        'returnChain',
        'JSON',

        // consensus
        'propose', // same word used to propose smart updates
        'prevote',
        'precommit',

        // onchain transactions
        'batch', // all transactions are batched one by one

        // methods below are per-assets (ie should have setAsset directive beforehand)
        'deposit', // send money to some channel or user
        'withdraw', // mutual *instant* withdrawal proof. Used during normal cooperation.
        'dispute', // defines signed state (balance proof). Used only as last resort!

        'revealSecrets', // reveal secrets if partner has not acked our del settle
        'vote'
    ]

    if (typeof i === 'string') {
        i = i.trim()
        if (methodMap.indexOf(i) == -1) throw `No such method: "${i}"`
        return methodMap.indexOf(i)
    } else {
        return methodMap[i]
    }
}
