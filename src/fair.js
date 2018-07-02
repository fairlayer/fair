require('./utils')
require('./offchain/utils')
require('./browser')

var SegfaultHandler = require('segfault-handler')
SegfaultHandler.registerHandler('crash.log')

argv = require('minimist')(process.argv.slice(2), {
  string: ['username', 'pw']
})

on_server = !!argv['prod-server']
datadir = argv.datadir ? argv.datadir : 'data'
base_port = argv.p ? parseInt(argv.p) : 8001
trace = !!argv.trace
argv.syncdb = argv.syncdb != 'off'
node_started_at = ts()

process.title = 'Fair ' + base_port

if (on_server) {
  let Raven = require('raven')
  Raven.config(
    'https://299a833b1763402f9216d8e7baeb6379@sentry.io/1226040'
  ).install()
}



cache = {
  ins: {},
  users: {},
  ch: {}
}

exitsync = false

initDashboard = require('./init_dashboard')

derive = async (username, pw) => {
  return new Promise((resolve, reject) => {
    require('../lib/scrypt')(
      pw,
      username,
      {
        N: Math.pow(2, 12),
        r: 8,
        p: 1,
        dkLen: 32,
        encoding: 'binary'
      },
      (r) => {
        r = bin(r)
        resolve(r)
      }
    )

    /* Native scrypt. TESTNET: we use pure JS scrypt
    var seed = await scrypt.hash(pw, {
      N: Math.pow(2, 16),
      interruptStep: 1000,
      p: 2,
      r: 8,
      dkLen: 32,
      encoding: 'binary'
    }, 32, username)

    return seed; */
  })
}

sync = () => {
  if (K.prev_hash) {
    // if we're member then sync from anyone except us
    var set = me.my_member ? Members.filter((m) => m != me.my_member) : Members
    var chosen = set[Math.floor(Math.random() * set.length)]

    //|| me.my_member

    if (K.ts < ts() - K.blocktime / 2 || me.my_member) {
      me.send(chosen, 'sync', r([fromHex(K.prev_hash)]))
    } else {
      l('No need to sync, K.ts is recent')
    }
  } else {
    l('No K.prev_hash to sync from')
  }
}

if (!fs.existsSync('data')) {
  fs.mkdirSync('data')
  fs.mkdirSync('data/onchain')
}
require('./db/onchain_db')

use_force = false
if (!fs.existsSync('./' + datadir + '/offchain')) {
  fs.mkdirSync('./' + datadir + '/offchain')
  use_force = true
}

require('./db/offchain_db')
;(async () => {
  await privSequelize.sync({force: use_force})

  if (argv.genesis) {
    require('../tools/genesis')()
  } else if (argv.cluster) {
    var cluster = require('cluster')
    if (cluster.isMaster) {
      cluster.fork()

      cluster.on('exit', function(worker, code, signal) {
        console.log('exit')
        cluster.fork()
      })
    }

    if (cluster.isWorker) {
      initDashboard()
    }
  } else {
    initDashboard()
  }
})()
/* Get randos:
var addr = []
for (let i = 8001; i < 8200; i++){
  let username = i.toString()
  let seed = await derive(username, 'password')
  await me.init(username, seed)
  addr.push(me.address)
}
*/
if (argv.monkey) {
  randos = fs
    .readFileSync('./tools/randos.txt')
    .toString()
    .split('\n')
    .slice(3, parseInt(argv.monkey) - 8000)
  l('Loaded randos: ' + randos.length)
}

openBrowser = () => {
  var url = `http://${localhost}:${base_port}/#?auth_code=${PK.auth_code}`
  l(note(`Open ${link(url)} in your browser`))
  try{ opn(url) } catch(e){}
}
