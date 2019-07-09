
import Context from './context'


import {
  rlp,
  fs,
  parseJSON, 
  derive,
  crypto,
} from './utils'


import Sequelize = require('sequelize');
import onchainModels from './db/onchain_db';
import offchainModels from './db/offchain_db';




async function startFairlayer() {
  const c: any = new Context

  console.log(process.argv)


  let argv = require('minimist')(process.argv.slice(2), {
    string: ['username', 'password']
  })
  
  /*
  c.setArgv(argv)

  try {
    l('Setting up ' + datadir)
    fs.mkdirSync('./' + datadir)
    fs.mkdirSync('./' + datadir + '/onchain')
    fs.mkdirSync('./' + datadir + '/offchain')
  } catch(e){}*/

  


  
  c.onchainDB = new Sequelize('db', 'username', 'password', {
    dialect: 'sqlite',
    storage: c.datadir + '/onchain/db.sqlite',
    define: {timestamps: false},
    operatorsAliases: false,
    benchmark: true
  })
  
  onchainModels(c.onchainDB);
  
  c.offchainDB = new Sequelize('data', 'root', '123123', {
    dialect: 'sqlite',
    storage: c.datadir + '/offchain/db.sqlite',
    define: {timestamps: true},
    operatorsAliases: false,
    retry: {
      max: 20
    },
    pool: {
      max: 10,
      min: 0,
      acquire: 10000,
      idle: 10000
    }
  })
  
  offchainModels(c.offchainDB)


  //require('./utils/genesis')(c.datadir)
  

  /*
  c.onchainState = JSON.parse(fs.readFileSync(c.datadir + '/onchain/state.json'))

  c.onchainState.validators.map((m) => {
    m.pubkey = Buffer.from(m.pubkey, 'hex')
    m.block_pubkey = Buffer.from(m.block_pubkey, 'hex')
  })


  // auth_code: crypto.randomBytes(32)
  
  
  c.offchainState = parseJSON(fs.readFileSync(c.datadir + '/offchain/state.json')))
  */




  //await c.offchainDB.db.sync({force: K.total_blocks < 3})


  

  //require('./default_wallet')()

  
  
  
  const repl = require('repl').start()

  Object.assign(repl.context, {c, rlp})

}

startFairlayer()