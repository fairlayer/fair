const getChain = require('./get_chain')

module.exports = async (ws, msg) => {
  // uws gives ArrayBuffer, we create a view
  let msgb = bin(msg)

  // count total bandwidth
  me.metrics.bandwidth.current += msgb.length

  // sanity checks
  if (msgb.length > 50000000) {
    l(`External_rpc, long input ${msgb.length}`)
    return false
  }

  if (msgb.length > 10000) {
    l(`Long input: ${msgb.length}`)
  }

  // we have no control over potentially malicious user input, so ignore all errors
  try {
    let content = r(msgb)

    let contentType = methodMap(readInt(content[0]))

    if (contentType == 'JSON') {
      let pubkey = content[1]
      let sig = content[2]
      let body = content[3]

      let json = parse(body.toString())

      if (
        RPC.requireSig.includes(json.method) &&
        !ec.verify(body, sig, pubkey)
      ) {
        l('Invalid sig in external_rpc')
        return false
      }

      if (trace) l(`From ${trim(pubkey)}:`, json)

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
          'requestWithdrawal',
          'testnet'
        ].includes(json.method)
      ) {
        require('./with_channel')(pubkey, json, ws)
      } else if (json.method == 'add_batch') {
        require('./add_batch')(json, ws)
      } else if (json.method == 'requestChain') {
        let raw_chain = await getChain(json)

        //l('Returning chain ', raw_chain.length)
        if (raw_chain.length > 0) {
          ws.send(r([methodMap('returnChain'), raw_chain]), wscb)
        } else {
          //me.textMessage()
          //l('No blocks to sync for ', json)
        }
      } else if (json.method == 'textMessage') {
        react({confirm: json.msg})
      } else if (json.method == 'onchainFaucet') {
        let pubkey = fromHex(json.pubkey)
        let msg = 'Unavailable faucet'

        if (me.batchAdd('deposit', [json.asset, [json.amount, pubkey, 0]])) {
          msg = `Expect onchain faucet for ${json.pubkey}...`
        }

        me.textMessage(pubkey, msg)
      }

      return
    } else if (contentType == 'returnChain') {
      // the only method that is not json to avoid serialization overhead

      return me.processChain(content[1])
    }
  } catch (e) {
    l('External RPC error', e)
  }
}
