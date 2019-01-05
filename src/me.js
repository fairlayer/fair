WebSocketClient = require('./utils/ws')
stringify = require('../lib/stringify')

class Me {
  // boilerplate attributes
  constructor() {
    this.status = 'await'

    this.my_bank = false

    this.mempool = []
    this.batch = []

    this.sockets = {}

    // array of sockets to frontends
    this.browsers = []

    this.busyPorts = [] // for cloud demos

    this.withdrawalRequests = {}

    this.show_empty_blocks = true

    this.last_react = ts()
    this.last_sync_changes = 0
    this.last_sync_chain = 0

    // generic metric boilerplate: contains array of averages over time
    let getMetric = () => {
      return {
        max: 0,
        started: ts(),
        total: 0,
        current: 0,
        last_avg: 0,
        avgs: []
      }
    }

    this.metrics = {
      volume: getMetric(),
      fail: getMetric(),
      settle: getMetric(),
      fees: getMetric(),
      syncChanges: getMetric(),

      //
      bandwidth: getMetric(),
      ecverify: getMetric()
    }
    cached_result.metrics = this.metrics

    // used to store current block to be added to chain
    this.proposed_block = null
    this.locked_block = null
  }

  // derives needed keys from the seed, saves creds into pk.json
  async init(username, seed) {
    this.username = username

    this.seed = seed
    this.id = nacl.sign.keyPair.fromSeed(this.seed)
    this.pubkey = bin(this.id.publicKey)

    this.block_keypair = nacl.sign.keyPair.fromSeed(sha3('block' + this.seed))
    this.block_pubkey = bin(this.block_keypair.publicKey).toString('hex')

    this.box = nacl.box.keyPair.fromSecretKey(this.seed)

    PK.username = username
    PK.seed = seed.toString('hex')
    PK.usedBanks = [1]
    PK.usedAssets = [1, 2]

    if (K) {
      // use 1st bank by default
      require('./internal_rpc/with_channel')({
        method: 'setLimits',
        they_pubkey: K.banks[0].pubkey,
        asset: 1,
        rebalance: K.rebalance,
        credit: K.credit
      })
    }

    await promise_writeFile(datadir + '/offchain/pk.json', JSON.stringify(PK))
  }

  // returns current address: pubkey, box_pubkey, banks
  getAddress() {
    let encodable = [
      me.record ? me.record.id : this.pubkey,
      bin(this.box.publicKey),
      PK.usedBanks
    ]
    return base58.encode(r(encodable))
  }

  is_me(pubkey) {
    return me.pubkey && me.pubkey.equals(pubkey)
  }

  // onchain events recorded for current user
  addEvent(data) {
    Event.create({
      blockId: K.total_blocks,
      data: stringify(data)
    })
  }

  //add a transaction to next batch
  batchAdd(method, args) {
    if (!me.record) {
      react({alert: "You can't do onchain tx if you are not registred"})
      return false
    }

    let mergeable = ['withdraw', 'deposit']

    if (mergeable.includes(method)) {
      let exists = me.batch.find((b) => b[0] == method && b[1][0] == args[0])

      if (exists) {
        // add to existing array
        exists[1][1].push(args[1])
      } else {
        // create new set, withdrawals go first
        me.batch[method == 'withdraw' ? 'unshift' : 'push']([
          method,
          [args[0], [args[1]]]
        ])
      }
    } else if (method == 'revealSecrets') {
      let exists = me.batch.find((b) => b[0] == method)
      // revealed secrets are not per-assets

      if (exists) {
        // add to existing array
        exists[1].push(args)
      } else {
        // create new set
        me.batch.push([method, [args]])
      }
    } else {
      me.batch.push([method, args])
    }

    return true
  }

  // compiles signed tx from current batch, not state changing
  async batch_estimate(opts = {}) {
    // we select our record again to get our current nonce
    if (!me.id || !me.record || me.batch.length == 0) {
      return false
    }

    let by_first = (a, b) => b[0] - a[0]

    let merged = me.batch.map((m) => {
      if (m[0] == 'deposit' || m[0] == 'withdraw') {
        m[1][1].sort(by_first)
      }

      return [methodMap(m[0]), m[1]]
    })

    let gaslimit = 0 //uncapped
    let gasprice = opts.gasprice ? parseInt(opts.gasprice) : K.min_gasprice

    let to_sign = r([
      methodMap('batch'),
      me.record.batch_nonce,
      gaslimit,
      gasprice,
      merged
    ])
    let signed_batch = r([me.record.id, ec(to_sign, me.id.secretKey), to_sign])

    return {
      signed_batch: signed_batch,
      size: to_sign.length,
      batch_nonce: me.record.batch_nonce,
      batch_body: merged
    }
  }

  // tell all validators the same thing
  sendAllValidators(data) {
    K.validators.map((c) => {
      me.send(c, data)
    })
  }

  // signs data and adds our pubkey
  envelope() {
    var msg = r(Object.values(arguments))
    return r([bin(me.id.publicKey), ec(msg, me.id.secretKey), msg])
  }

  block_envelope() {
    var msg = r(Object.values(arguments))
    return r([
      bin(me.block_keypair.publicKey),
      ec(msg, me.block_keypair.secretKey),
      msg
    ])
  }

  async start() {
    // in json pubkeys are in hex
    me.record = await User.findOne({
      where: {pubkey: bin(me.id.publicKey)},
      include: [Balance]
    })

    if (me.record) {
      me.my_validator = K.validators.find((m) => m.id == me.record.id)
      me.my_bank = K.banks.find((m) => m.id == me.record.id)
    }

    // both validators and banks must run external_wss
    if (me.my_validator) {
      Periodical.startValidator()
    }

    if (me.my_bank) {
      Periodical.startBank()
    }

    if (me.my_validator) {
      for (var m of K.validators) {
        if (me.my_validator != m) {
          // we need to have connections ready to all validators
          me.send(m, {method: 'auth', data: ts()})
        }
      }
    } else {
      // keep connection to all banks
      K.validators.map((m) => {
        if (me.my_validator != m) {
          me.send(m, {method: 'auth', data: ts()})

          //l('Connected to ', m)
        }
      })
    }

    if (argv.CHEAT) {
      // byzantine and testing flags
      argv.CHEAT.split(',').map((flag) => (me['CHEAT_' + flag] = true))
    }

    if (K.total_blocks > 1) {
      snapshotHash()
    } else {
      // initial run? go monkey e2e test
      require('../test/monkey')
    }

    Periodical.scheduleAll()
  }

  async startExternalRPC(advertized_url) {
    if (!advertized_url) {
      return l('Cannot start rpc on ', advertized_url)
    }

    if (me.external_wss_server) {
      return l('Already have external server started')
    }
    // there's 2nd dedicated websocket server for validator/bank commands

    me.external_wss_server = require('http').createServer(async (req, res) => {
      var [path, query] = req.url.split('?')
      // call /faucet?address=ME&amount=100&asset=1
      if (path.startsWith('/faucet')) {
        res.setHeader('Access-Control-Allow-Origin', '*')

        let args = querystring.parse(query)
        l('faucet ', args)

        let status = await me.payChannel({
          address: args.address,
          amount: parseInt(args.amount),
          asset: parseInt(args.asset)
        })
        res.end(status)
      }
    })

    var port = parseInt(advertized_url.split(':')[2])
    me.external_wss_server.listen(on_server ? port + 200 : port)

    l(`Bootstrapping external_wss at: ${advertized_url}`)

    // lowtps/hightps
    me.external_wss = new (base_port == 8433 ? require('uws') : ws).Server({
      //noServer: true,
      //port: port,
      clientTracking: false,
      perMessageDeflate: false,
      server: me.external_wss_server,
      maxPayload: 64 * 1024 * 1024
    })

    me.external_wss.on('error', function(err) {
      l(err)
    })
    me.external_wss.on('connection', function(ws) {
      ws.on('message', (msg) => {
        RPC.external_rpc(ws, msg)
      })
    })
  }

  textMessage(they_pubkey, msg) {
    me.send(they_pubkey, {method: 'textMessage', msg: msg})
  }

  // a generic interface to send a websocket message to some user or validator
  // accepts Buffer or valid Service object
  send(m, json) {
    if (typeof m == 'string') m = fromHex(m)

    var msg = bin(JSON.stringify(json))

    if (RPC.requireSig.includes(json.method)) {
      msg = r([
        methodMap('JSON'),
        bin(me.id.publicKey),
        bin(ec(msg, me.id.secretKey)),
        msg
      ])
    } else {
      msg = r([methodMap('JSON'), null, null, msg])
    }

    // regular pubkey
    if (m instanceof Buffer) {
      //if (json.method == 'update') l(`Sending to ${trim(m)} `, toHex(sha3(tx)))

      if (me.sockets[m]) {
        me.sockets[m].send(msg, wscb)
        return true
      } else {
        // try to find by this pubkey among validators/banks
        var validator = K.validators.find((f) => f.pubkey.equals(m))
        var bank = K.banks.find((f) => fromHex(f.pubkey).equals(m))
        if (validator) {
          m = validator
        } else if (bank) {
          m = bank
        } else {
          //l('Not online: ', m)
          return false
        }
      }
    }

    if (me.my_validator == m) {
      // send to self internally
      RPC.external_rpc(false, msg)
      return
    }

    if (trace) l(`Send ${m.id}`, json)

    if (me.sockets[m.pubkey]) {
      return me.sockets[m.pubkey].send(msg, wscb)
    } else {
      me.sockets[m.pubkey] = new WebSocketClient()

      me.sockets[m.pubkey].onmessage = (msg) => {
        RPC.external_rpc(me.sockets[m.pubkey], msg)
      }

      me.sockets[m.pubkey].onerror = function(e) {
        l('Failed to open the socket to ', m)
      }
      me.sockets[m.pubkey].onopen = function(e) {
        if (me.id) {
          me.send(m.pubkey, {method: 'auth', data: ts()})
        }

        //me.sockets[m.pubkey].send(msg, wscb)
      }

      me.sockets[m.pubkey].open(m.location)
    }

    return true
  }
}

Me.prototype.consensus = require('./consensus')

Me.prototype.processChain = require('./onchain/process_chain')
Me.prototype.processBlock = require('./onchain/process_block')
Me.prototype.processBatch = require('./onchain/process_batch')

Channel.get = require('./offchain/get_channel')

Me.prototype.payChannel = require('./offchain/pay_channel')
Me.prototype.flushChannel = require('./offchain/flush_channel')
Me.prototype.updateChannel = require('./offchain/update_channel')

module.exports = Me
