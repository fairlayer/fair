const Periodical = {
  consensus: require('../consensus'),

  syncChain: require('./sync_chain'),
  syncChanges: require('./sync_changes'),
  updateMetrics: require('./update_metrics'),
  updateCache: require('./update_cache'),
  rebalance: require('./rebalance'),
  ensureAck: require('./ensure_ack'),
  broadcast: require('./broadcast'),
  forceReact: () => {
    react({})
  },

  timeouts: {}
}

Periodical.schedule = function schedule(task, timeout) {
  if (Periodical.timeouts[task]) {
    // clear if there's existing timeout and re-schedule
    clearTimeout(Periodical.timeouts[task])
    delete Periodical.timeouts[task]
  }

  if (timeout == 0) return

  var wrap = async function() {
    //l('Start ', task)
    await Periodical[task]()
    Periodical.timeouts[task] = setTimeout(wrap, timeout)
  }

  wrap()
}

Periodical.startValidator = () => {
  l('Starting validator ', me.my_validator)
  me.startExternalRPC(me.my_validator.location)
  Periodical.schedule('consensus', 250)
}

Periodical.startBank = () => {
  //if (!me.external_wss_server){
  l('Starting bank ', me.my_bank)
  me.startExternalRPC(me.my_bank.location)

  Periodical.schedule('rebalance', K.blocktime * 3)

  // banks have to force react regularly
  Periodical.schedule('forceReact', K.blocktime)
  //}
}

Periodical.scheduleAll = function() {
  Periodical.schedule('updateMetrics', 1000)
  Periodical.schedule('updateCache', K.blocktime)

  Periodical.schedule('syncChanges', K.blocktime)

  //Periodical.schedule('ensureAck', K.blocktime * 2)
}

module.exports = Periodical
