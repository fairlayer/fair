module.exports = async (pubkey, json, ws) => {
  // json.data is Date.now()

  // wrap in custom WebSocketClient if it is a raw ws object
  if (ws.instance) {
    me.sockets[pubkey] = ws
  } else {
    me.sockets[pubkey] = new WebSocketClient()
    me.sockets[pubkey].instance = ws
  }

  if (trace) l('New peer: ', pubkey)
}
