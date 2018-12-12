const Router = require('../router')
const withdraw = require('../offchain/withdraw')

/*
let setBrowser = (ws) => {
  // new window replaces old one
  if (me.browser && me.browser.readyState == 1) {
    me.browser.send(JSON.stringify({already_opened: true}))
  }

  me.browser = ws
}
*/

module.exports = async (ws, json) => {
  // prevents all kinds of CSRF and DNS rebinding
  // strong coupling between the console and the browser client

  // public RPC, return cached_result only
  if (json.auth_code != PK.auth_code && ws != 'admin') {
    //if (!json.auth_code) {
    //l('Not authorized')
    let resp =
      json.method == 'login'
        ? {alert: 'Invalid auth_code, restart node'}
        : cached_result
    ws[ws.end ? 'end' : 'send'](JSON.stringify(resp))

    return
  }

  if (ws.send && json.is_wallet && !me.browsers.includes(ws)) {
    me.browsers.push(ws)
    //setBrowser(ws)
  }

  // internal actions that require authorization

  var result = {}
  switch (json.method) {
    case 'load':
      // triggered by frontend to update

      // public + private info
      //react({public: true, private: true, force: true})
      //return

      break
    case 'login':
      await require('./login')(json.params)
      return

      break

    case 'logout':
      result = require('./logout')()
      break

    case 'sendOffchain':
      await me.payChannel(json.params)
      break

    case 'startDispute':
      let ch = await Channel.get(json.params.they_pubkey)
      me.batchAdd('dispute', await startDispute(ch))
      react({confirm: 'OK'})

      break
    case 'withChannel':
      require('./with_channel')(json.params)
      break

    case 'onchainFaucet':
      json.params.pubkey = me.pubkey
      json.params.method = 'onchainFaucet'

      me.send(K.banks[0], json.params)

      break

    case 'externalDeposit':
      require('./external_deposit')(json.params)
      break

    case 'broadcast':
      Periodical.broadcast(json.params)
      react({force: true})
      return false
      break

    case 'getRoutes':
      result.parsedAddress = await parseAddress(json.params.address)

      result.bestRoutes = await Router.bestRoutes(
        json.params.address,
        json.params
      )

      break

    case 'clearBatch':
      me.batch = []
      react({confirm: 'Batch cleared'})
      break

    case 'getinfo':
      result = require('./get_info')()
      break

    case 'propose':
      result = require('./propose')(json.params)
      break

    case 'vote':
      result = require('./vote')(json.params)
      break

    case 'sync':
      result = require('./sync')(json.params)
      break

    // commonly called by merchant app on the same server
    case 'receivedAndFailed':
      result = await require('./received_and_failed')(ws)
      break

    default:
      result.alert = 'No method provided'
  }

  result.authorized = true

  react({public: true, private: true, force: json.method == 'load'})

  // http or websocket?
  if (ws.end) {
    ws.end(JSON.stringify(result))
  } else if (ws == 'admin') {
    return result
  } else {
    ws.send(JSON.stringify(result))
    //react(result)
  }
}
