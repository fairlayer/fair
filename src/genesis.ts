// this file is only used during genesis to set initial K params and create first validators
const derive = require('./derive')

const createValidator = async (username, pw, loc, website) => {


  const seed = await derive(username, pw)
  

  const user = await User.create({
    pubkey: me.pubkey,
    username: username
  })

  await user.createBalance({
    asset: 1,
    balance: 10000000000
  })
  await user.createBalance({
    asset: 2,
    balance: 10000000000
  })

  const validator = {
    id: user.id,
    username: username,
    location: loc,
    website: website,
    pubkey: toHex(me.pubkey),
    box_pubkey: toHex(bin(me.box.publicKey)),
    block_pubkey: me.block_pubkey,
    missed_blocks: [],
    shares: 0
  }

  return [validator, seed]
}



module.exports = async (datadir) => {

  
  // all timeouts are in milliseconds
  let sec = 1000

  // K is a handy config JSON
  const K = {
    // Things that are different in testnet vs mainnet
    network_name: 'testnet',
    blocksize: 20000,
    blocktime: 10 * sec,
    step_latency: 2 * sec, // how long is each consensus step: propose, prevote, precommit, await is the rest
    gossip_delay: 1 * sec, // anti clock skew, give others time to change state

    //Time.at(1913370000) => 2030-08-19 20:40:00 +0900

    bet_maturity: Date.now() + 100 * sec, // when all FRB turn into FRD
    created_at: Date.now(),

    usable_blocks: 0, // blocks that have some extra space (to ensure disputes add on-time)
    total_blocks: 0, // total number of blocks full or not

    total_tx: 0,
    total_bytes: 0,

    total_tx_bytes: 0,

    voting_period: 10,

    current_db_hash: '',

    blocks_since_last_snapshot: 999999999, // force to do a snapshot on first block
    last_snapshot_height: 0,

    snapshot_after_blocks: 100, // something like every hour is good enough
    snapshots_taken: 0,
    proposals_created: 0,

    // cents per 100 bytes of tx
    min_gasprice: 1,

    // manually priced actions to prevent spam
    account_creation_fee: 100,

    standalone_balance: 1000, // keep $10 on your own balance for unexpected onchain fees
    bank_standalone_balance: 100000, // bank has higher operational costs, so $1k is safer for unexpected onchain fees

    // up to X seconds, validators don't propose blocks if empty
    // the problem is all delayed actions also happen much later if no blocks made
    skip_empty_blocks: 0,

    // each genesis is randomized
    prev_hash: toHex(crypto.randomBytes(32)), // toHex(Buffer.alloc(32)),

    risk: 10000, // banks usually withdraw after this amount

    credit: 50000000, // how much can a user lose if bank is insolvent?
    rebalance: 5000000, // rebalance after

    collected_fees: 0,

    // latest block done at
    ts: 0,

    assets_created: 2,

    // sanity limits for offchain payments
    min_amount: 5,
    max_amount: 300000000,

    validators: [],
    banks: [],

    cache_timeout: 3 * sec, //keep channel in memory since last use
    safe_sync_delay: 180 * sec, //after what time prohibit using wallet if unsynced
    sync_limit: 500, // how many blocks to share at once

    // global wide fee sanity limits
    min_fee: 1,
    max_fee: 5000,

    // hashlock and dispute-related
    secret_len: 32,

    dispute_delay_for_users: 8, // in how many blocks disputes are considered final
    dispute_delay_for_banks: 4, // fast reaction is expected by banks

    hashlock_exp: 16, // how many blocks (worst case scenario) a user needs to be a able to reveal secret
    hashlock_keepalive: 100, // for how many blocks onchain keeps it unlocked since reveal (it takes space on all fullnodes, so it must be deleted eventually)
    max_hashlocks: 20, // we don't want overweight huge dispute strings
    hashlock_service_fee: 100, // the one who adds hashlock pays for it

    // ensure it is much shorter than hashlock_exp
    dispute_if_no_ack: 60 * sec // how long we wait for ack before going to blockchain
  }

  // Defines global Byzantine tolerance parameter
  // 0 would require 1 validator, 1 - 4, 2 - 7.
  K.tolerance = 1

  K.total_shares = K.tolerance * 3 + 1

  K.majority = K.total_shares - K.tolerance

  const local = !argv['prod-server']

  const base_rpc = local ? 'ws://127.0.0.1'  : 'wss://fairlayer.com'
  const base_web = local ? 'http://127.0.0.1' : 'https://fairlayer.com'

  // validators provide services: 1) build blocks 2) banks 3) watchers 4) storage of vaults

  // create bank
  const [bankValidator, bankSeed] = await createValidator(
    'root',
    toHex(crypto.randomBytes(16)),
    `${base_rpc}:8100`,
    local ? 'http://127.0.0.1:8433' : 'https://fairlayer.com'
  )
  K.validators.push(bankValidator)

  // create other validators
  for (const i of [8001, 8002, 8003]) {
    const [validator, _] = await createValidator(
      i.toString(),
      'password',
      `${base_rpc}:${i + 100}`,
      `${base_web}:${i}`
    )



    K.validators.push(validator)

    
  }

  // distribute shares
  K.validators[0].shares = 1
  K.validators[0].platform = 'Digital Ocean SGP1'

  K.validators[1].shares = 1
  K.validators[1].platform = 'AWS'

  K.validators[2].shares = 1
  K.validators[2].platform = 'Azure'

  K.validators[3].shares = 1
  K.validators[3].platform = 'Google Cloud'

  // set bank
  K.banks.push({
    id: K.validators[0].id,
    location: K.validators[0].location,
    pubkey: K.validators[0].pubkey,
    box_pubkey: K.validators[0].box_pubkey,

    website: 'https://fairlayer.com',
    // basis points
    fee_bps: 10,
    createdAt: Date.now(),

    handle: 'Firstbank'
  })


  K.routes = []



  
  await Asset.create({
    ticker: 'FRD',
    name: 'Fair dollar',
    desc: 'FRD',
    issuerId: 1,
    total_supply: 1000000000
  })

  await Asset.create({
    ticker: 'FRB',
    name: 'Fair bet',
    desc:
      'Capped at 100 billions, will be automatically converted into FRD 1-for-1 on 2030-08-19.',
    issuerId: 1,
    total_supply: 1000000000
  })

  // private config
  const PK = {
    username: 'root',
    seed: bankSeed.toString('hex'),
    auth_code: toHex(crypto.randomBytes(32))

  }

  await promise_writeFile('./' + datadir + '/offchain/pk.json', stringify(pk))

  
  // not graceful to not trigger hooks
  process.exit(0)
}
