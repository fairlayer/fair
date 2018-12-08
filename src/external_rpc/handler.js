const getChain = require('./get_chain')

module.exports = async (ws, msg) => {
  // uws gives ArrayBuffer, we create a view
  let msgb = bin(msg)

  // count total bandwidth
  me.metrics.bandwidth.current += msgb.length

  // sanity checks
  if (msgb.length > 50000000) {
    l(`too long input ${msgb.length}`)
    return false
  }

  // we have no control over potentially malicious user input, so ignore all errors
  try {
    let contentType = methodMap(msgb[0])
    let content = msgb.slice(1)

    if (contentType == 'JSON') {
      var [pubkey, sig, body] = r(content)
      let json = parse(body.toString())

      if (
        RPC.requireSig.includes(json.method) &&
        !ec.verify(body, sig, pubkey)
      ) {
        l('Invalid sig in external_rpc')
        return false
      }

      if (json.method == 'auth') {
        require('./auth')(pubkey, json, ws)
      } else if (json.method == 'propose') {
        require('./propose')(pubkey, json, ws)
      } else if (json.method == 'prevote' || json.method == 'precommit') {
        require('./prevote_precommit')(pubkey, json, ws)
      } else if (
        [
          'update',
          'setLimits',
          'requestInsurance',
          'requestCredit',
          'giveWithdrawal',
          'requestWithdawal',
          'testnet'
        ].includes(json.method)
      ) {
        require('./with_channel')(pubkey, json, ws)
      } else if (json.method == 'add_batch') {
        require('./add_batch')(json, ws)
      } else if (json.method == 'requestChain') {
        let raw_chain = await getChain({
          their_block: parseInt(json.their_block),
          limit: parseInt(json.limit)
        })

        //l('Returning chain ', raw_chain.length)
        if (raw_chain.length > 3) {
          ws.send(concat(bin(methodMap('returnChain')), raw_chain), wscb)
        } else {
          //l('No blocks to sync after ')
        }
      } else if (json.method == 'textMessage') {
        react({confirm: json.msg})
      }

      return
    } else if (contentType == 'returnChain') {
      // the only method that is not json to avoid serialization overhead

      return me.processChain(r(content))
    }
  } catch (e) {
    l('External RPC error', e)
  }
}
