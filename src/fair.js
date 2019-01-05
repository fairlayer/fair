require('./utils/system')
require('./utils/channel')
require('./utils/debug')

const functions = require('./utils/functions')
Object.assign(global, functions)

// enumerator of all methods and tx types in the system
methodMap = require('./utils/method_map')
derive = require('./utils/derive')

require('./browser')

const SegfaultHandler = require('segfault-handler')
SegfaultHandler.registerHandler('crash.log')

argv = require('minimist')(process.argv.slice(2), {
  string: ['username', 'pw']
})

datadir = argv.datadir ? argv.datadir : 'data'
base_port = argv.p ? parseInt(argv.p) : 8001
trace = !!argv.trace
node_started_at = ts()

process.title = 'Fairlayer ' + base_port

cache = {
  ins: {},
  users: {},
  ch: {}
}

exitsync = false

monkeys = []

on_server = !!argv['prod-server']

let git_commit = child_process
  .execSync('cat HEAD')
  .toString()
  .trim()

// must stay global for logs
Raven = require('raven')
Raven.config('https://299a833b1763402f9216d8e7baeb6379@sentry.io/1226040', {
  release: git_commit
}).install()

const OnchainDB = require('./db/onchain_db')
const OffchainDB = require('./db/offchain_db')

startFairlayer = async () => {
  setupDirectories(datadir)
  let offchain_exists = fs.existsSync('./' + datadir + '/offchain/db.sqlite')

  if (argv.test) {
    child_process.execSync(`cp test/simple/onchain/* data/onchain;`)
  }

  const onchainDB = new OnchainDB(datadir, argv['genesis'])
  const offchainDB = new OffchainDB(
    datadir,
    argv['db'],
    argv['db-pool'],
    argv.genesis
  )

  try {
    await onchainDB.init()
    await offchainDB.init()
  } catch (e) {
    throw e
  }

  // temporary measure
  global.onchainDB = onchainDB
  global.offchainDB = offchainDB
  Object.assign(global, global.onchainDB.models)
  Object.assign(global, global.offchainDB.models)

  let inspect = function() {
    return JSON.stringify(this, null, 4)
  }

  User.prototype.inspect = inspect
  Payment.prototype.inspect = inspect
  Channel.prototype.inspect = inspect
  Subchannel.prototype.inspect = inspect

  Me = require('./me')

  if (argv.genesis) {
    return require('./utils/genesis')(datadir)
  }

  K = loadKFile(datadir)
  // unpack hex
  K.validators.map((m) => {
    m.pubkey = Buffer.from(m.pubkey, 'hex')
    m.block_pubkey = Buffer.from(m.block_pubkey, 'hex')
  })

  PK = loadPKFile(datadir)
  // it's important to not lose block we precommited to.
  if (PK.locked_block) {
    PK.locked_block.proposer = fromHex(PK.locked_block.proposer)
    PK.locked_block.sig = fromHex(PK.locked_block.sig)
    PK.locked_block.header = fromHex(PK.locked_block.header)
    PK.locked_block.ordered_tx_body = fromHex(PK.locked_block.ordered_tx_body)
  }

  await promise_writeFile(datadir + '/offchain/pk.json', JSON.stringify(PK))

  //ensure for sqlite: if (!fs.existsSync('./' + datadir)) {

  // TODO: how to sync with force? sqlite vs postgres
  // only on new install
  //if (K.total_blocks <= 3) {
  l('Syncing with force ' + K.total_blocks)
  await offchainDB.db.sync({force: K.total_blocks < 3})
  //}

  if (argv.generate_monkeys) {
    await generateMonkeys()
  }

  if (argv.monkey) {
    monkeys = loadMonkeys(argv.monkey)
  }

  // if (argv.cluster) {
  //   const cluster = require('cluster')
  //   if (cluster.isMaster) {
  //     cluster.fork()

  //     cluster.on('exit', function(worker, code, signal) {
  //       console.log('exit')
  //       cluster.fork()
  //     })
  //   }

  //   if (cluster.isWorker) {
  //     initDashboard()
  //   }

  //   return
  // }

  me = new Me()

  let username, password
  if (argv.username && argv.pw) {
    username = argv.username
    password = await derive(argv.username, argv.pw)
  } else if (PK.username && PK.seed) {
    username = PK.username
    password = Buffer.from(PK.seed, 'hex')
  }

  if (username && password) {
    await me.init(username, password)
    await me.start()
  }

  if (argv.test) {
    let binary = r(fs.readFileSync(`test/simple/blocks`))
    argv.stop_blocks = binary.length
    argv.nocrypto = true
    l('Blocks: ' + binary.length)
    await me.processChain(binary)
    return
  }

  require('./init_dashboard')()

  if (argv.rpc) {
    RPC.internal_rpc('admin', argv)
  }

  // start syncing as soon as the node is started
  /*setInterval(() => {
    // propose step means last block was just finalized K.step_latency * 3
    //if (ts() % K.blocktime < 3) {
    Periodical.syncChain()
    //}
  }, 200)*/

  Periodical.schedule('syncChain', 200)

  l(`\n${note('Welcome to Fairlayer!')}`)
  repl = require('repl').start(note(''))
  repl.context.me = me
}

startFairlayer()
