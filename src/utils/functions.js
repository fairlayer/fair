const fs = require('fs')
const path = require('path')

// returns validator making block right now, use skip=true to get validator for next slot
const nextValidator = (skip = false) => {
  const currentIndex = Math.floor(ts() / K.blocktime) % K.total_shares

  let searchIndex = 0
  for (let i = 0; i < K.validators.length; i++) {
    const current = K.validators[i]
    searchIndex += current.shares

    if (searchIndex <= currentIndex) continue
    if (skip == false) return current

    // go back to 0
    if (currentIndex + 1 == K.total_shares) return K.validators[0]

    // same validator
    if (currentIndex + 1 < searchIndex) return current

    // next validator
    return K.validators[i + 1]
  }
}

const parseAddress = async (address) => {
  //l('Parse ', address)
  let addr = address.toString()
  let invoice = false

  if (addr.includes('#')) {
    // the invoice is encoded as #hash in destination and takes precedence over manually sent invoice
    ;[addr, invoice] = addr.split('#')
  }
  let parts = []

  try {
    parts = r(base58.decode(addr))
    if (parts[2]) parts[2] = parts[2].map((val) => readInt(val))
  } catch (e) {}

  if (parts[0] && parts[0].length <= 6) {
    // not pubkey? can be an id and we find out real pubkey
    let u = await User.findById(readInt(parts[0]), {include: [Balance]})
    if (u) {
      parts[0] = u.pubkey
    }
  }

  // both pubkeys and bank list must be present
  if (parts[0] && parts[0].length == 32 && parts[1] && parts[1].length == 32) {
    return {
      pubkey: parts[0],
      box_pubkey: parts[1],
      banks: parts[2],
      invoice: invoice,
      address: addr
    }
  } else {
    l('bad address: ', stringify(addr))
    return false
  }
}

const loadKFile = (datadir) => {
  l('Loading K data')

  const kFile = path.resolve(__dirname, '../../' + datadir + '/onchain/k.json')
  if (!fs.existsSync(kFile)) {
    fatal(`Unable to read ${highlight(kFile)}, quitting`)
  }

  const json = fs.readFileSync(kFile)
  return JSON.parse(json)
}

const loadPKFile = (datadir) => {
  l('Loading PK data')
  const pkFile = './' + datadir + '/offchain/pk.json'
  if (!fs.existsSync(pkFile)) {
    // used to authenticate browser sessions to this daemon
    return {
      auth_code: toHex(crypto.randomBytes(32)),
      pendingBatchHex: null
    }
  }

  const json = fs.readFileSync(pkFile)
  return JSON.parse(json)
}

const generateMonkeys = async () => {
  const derive = require('./derive')
  const addr = []

  for (let i = 8001; i < 8060; i++) {
    const username = i.toString()
    const seed = await derive(username, 'password')
    const me = new Me()
    await me.init(username, seed)
    // all monkeys use first bank by default
    PK.usedBanks = [1]
    PK.usedAssets = [1, 2]
    addr.push(me.getAddress())
  }
  // save new-line separated monkey addresses
  await promise_writeFile('./tools/monkeys.txt', addr.join('\n'))
}

const loadMonkeys = (monkey_port) => {
  const monkeys = fs
    .readFileSync('./tools/monkeys.txt')
    .toString()
    .split('\n')
    .slice(3, parseInt(monkey_port) - 8000)

  l('Loaded monkeys: ' + monkeys.length)

  return monkeys
}

const setupDirectories = (datadir) => {
  if (!fs.existsSync('./' + datadir)) {
    l('Setting up ' + datadir)
    fs.mkdirSync('./' + datadir)
    fs.mkdirSync('./' + datadir + '/onchain')
    fs.mkdirSync('./' + datadir + '/offchain')
    return
  }

  if (!fs.existsSync('./' + datadir + '/onchain')) {
    fs.mkdirSync('./' + datadir + '/onchain')
  }

  if (!fs.existsSync('./' + datadir + '/offchain')) {
    fs.mkdirSync('./' + datadir + '/offchain')
  }
}

const getSubchannel = async function(ch, asset = 1) {
  let found = ch.d.subchannels.find((s) => s.asset == asset)

  if (found) {
    return found
  } else {
    found = await ch.d.createSubchannel({
      asset: asset
    })
    return found
  }
}

const getInsuranceBetween = async function(user1, user2) {
  if (
    user1.pubkey.length != 32 ||
    user2.pubkey.length != 32 ||
    !user1.id ||
    !user2.id
  ) {
    return false
  }

  const compared = Buffer.compare(user1.pubkey, user2.pubkey)
  if (compared == 0) return false

  const wh = {
    leftId: compared == -1 ? user1.id : user2.id,
    rightId: compared == -1 ? user2.id : user1.id
  }
  const str = stringify([wh.leftId, wh.rightId])

  //if (cache.ins[str]) return cache.ins[str]

  let ins = (await Insurance.findOrBuild({
    where: wh,
    defaults: {subinsurances: []}, //needed to get [] attr
    include: [Subinsurance]
  }))[0]

  /*

  if (ins.id) {
    cache.ins[str] = ins
  }*/

  return ins
}

// you cannot really reason about who owns what by looking at onchain db only (w/o offdelta)
// but the banks with higher sum(insurance) locked around them are more trustworthy
// and users probably own most part of insurances around them
const getInsuranceSumForUser = async function(id, asset = 1) {
  return 0

  const sum = await Insurance.sum('insurance', {
    where: {
      [Op.or]: [{leftId: id}, {rightId: id}],
      asset: asset
    }
  })

  return Math.max(sum, 0)
}

const getUserByIdOrKey = async function(id) {
  if (typeof id != 'number' && id.length != 32) {
    id = readInt(id)
  }

  let u = false

  // if integer, iterate over obj, if pubkey return by key
  /*if (typeof id == 'number') {
    for (var key in cache.users) {
      if (cache.users[key].id == id) {
        u = cache.users[key]
        break
      }
    }
  } else {
    u = cache.users[id]
  }
  if (u) return u

  */

  if (typeof id == 'number') {
    u = await User.findById(id, {include: [Balance]})
  } else {
    // buffer

    u = (await User.findOrBuild({
      where: {pubkey: id},
      defaults: {balances: []}, //needed to get [] attr
      include: [Balance]
    }))[0]
  }

  /*
  if (u) {
    cache.users[u.pubkey] = u
  }*/

  return u
}

const userAsset = (user, asset, diff) => {
  if (!user.balances) return 0

  if (diff) {
    let b = user.balances.by('asset', asset)

    if (b) {
      b.balance += diff
      return b.balance
    } else {
      // todo is safe to not save now?
      b = Balance.build({
        userId: user.id,
        asset: asset,
        balance: diff
      })
      user.balances.push(b)

      return b.balance
    }
  } else {
    let b = user.balances.by('asset', asset)

    return b ? b.balance : 0
  }
}

const userPayDebts = async (user, asset, parsed_tx) => {
  if (!user.has_debts) return false

  const debts = await user.getDebts({where: {asset: asset}})

  for (const d of debts) {
    var u = await User.findById(d.oweTo, {include: [Balance]})

    // FRD cannot be enforced below safety limit,
    // otherwise the nodes won't be able to send onchain tx
    const chargable =
      asset == 1
        ? userAsset(user, asset) - K.bank_standalone_balance
        : userAsset(user, asset)

    if (d.amount_left <= userAsset(user, asset)) {
      userAsset(user, asset, -d.amount_left)
      userAsset(u, asset, d.amount_left)

      parsed_tx.events.push(['enforceDebt', d.amount_left, u.id])

      await saveId(u)
      await d.destroy() // the debt was paid in full
    } else {
      d.amount_left -= chargable
      userAsset(u, asset, chargable)
      userAsset(user, asset, -chargable) // this user's balance is 0 now!

      parsed_tx.events.push(['enforceDebt', chargable, u.id])

      await saveId(u)
      await d.save()

      break
    }
  }

  // no debts left (including other assets)?
  if ((await user.countDebts()) == 0) {
    user.has_debts = false
  }
  await saveId(user)
}

let findRevealed = async (locks) => {
  var final = 0
  for (var lock of locks) {
    var hl = await Hashlock.findOne({
      where: {
        hash: lock[1]
      }
    })

    if (hl) {
      if (hl.revealed_at <= readInt(lock[2])) {
        final += readInt(lock[0])
      } else {
        l('Revealed too late ', lock)
      }
    } else {
      l('Failed to unlock: ', lock)
    }
  }
  return final
}

const insuranceResolve = async (ins) => {

  if (!ins.dispute_state) {
    return l("No dispute_state to resolve")
  }


  var left = await getUserByIdOrKey(ins.leftId)
  var right = await getUserByIdOrKey(ins.rightId)
  var allResolved = []

  // processing actual subchannels
  let subchannels = r(ins.dispute_state)
  for (let subch of subchannels) {
    let asset = readInt(subch[0])
    let subins = ins.subinsurances.by('asset', asset)

    let delta = (subins ? subins.ondelta : 0)
    delta += readInt(subch[1], true) //offdelta

    // revealed in time hashlocks are applied to delta
    delta += await findRevealed(subch[2])
    delta -= await findRevealed(subch[3])


    var resolved = resolveChannel(
      subins ? subins.balance : 0,
      delta,
      true
    )
    resolved.asset = asset

    // splitting insurance between users
    userAsset(left, asset, resolved.insured)
    userAsset(right, asset, resolved.they_insured)

    let debtor = false

    let payOrDebt = async (asset, debtor, oweTo, amount_left) => {
      // ensure FRD is not exhausted

      if (userAsset(debtor, asset) >= amount_left) {
        // pay now
        userAsset(debtor, asset, -amount_left)
        userAsset(oweTo, asset, amount_left)
        return false
      } else {
        debtor.has_debts = true
        return await Debt.create({
          asset: asset,
          userId: debtor.id,
          oweTo: oweTo.id,
          amount_left: amount_left
        })
      }
    }

    // anybody owes to anyone?
    if (resolved.uninsured > 0) {
      resolved.debt = await payOrDebt(asset, right, left, resolved.uninsured)
    } else if (resolved.they_uninsured > 0) {
      resolved.they_debt = await payOrDebt(asset, left, right, resolved.they_uninsured)      
    }


    if (subins) {
      // zeroify now
      await subins.destroy()
    }


    allResolved.push(resolved)
  }
  ins.dispute_delayed = null
  ins.dispute_state = null
  ins.dispute_left = null

  //ins.dispute_nonce = null

  await saveId(ins)
  await saveId(left)
  await saveId(right)

  var withUs = me.is_me(left.pubkey)
    ? right
    : me.is_me(right.pubkey)
      ? left
      : false

  // are we in this dispute? Unfreeze the channel
  if (withUs) {
    var ch = await Channel.get(withUs.pubkey)
    ch.ins = ins
    // reset all credit limits - the relationship starts "from scratch"
    // nullify offdeltas
    for (let subch of ch.d.subchannels) {
      subch.offdelta = 0
      subch.rebalance = 0
      subch.credit = 0
      subch.they_rebalance = 0
      subch.they_credit = 0

      await subch.save()
    }

    // reset disputed status and ack timestamp
    ch.d.status = 'master'
    ch.d.ack_requested_at = null
    await saveId(ch.d)

    me.addEvent({
      type: 'disputeResolved',
      ins: ins,
      outcomes: allResolved
    })
  }

  return allResolved
}

const proposalExecute = async (proposal) => {
  if (proposal.code) {
    await eval(`(async function() { ${proposal.code} })()`)
  }

  if (proposal.patch.length > 0) {
    me.request_reload = true
    try {
      const pr = require('child_process').exec(
        'patch -p1',
        (error, stdout, stderr) => {
          console.log(error, stdout, stderr)
        }
      )
      pr.stdin.write(proposal.patch)
      pr.stdin.end()
    } catch (e) {
      l(e)
    }
  }
}

const startDispute = async (ch) => {
  // post last sig if any
  let id = ch.partner ? ch.partner : ch.d.they_pubkey
  ch.d.status = 'disputed'
  ch.d.ack_requested_at = null
  await ch.d.save()

  // the user is not even registered (we'd have to register them first)

  return ch.d.sig ? [id, ch.d.sig, ch.d.signed_state] : [id]
}

const deltaVerify = (delta, state, ackSig) => {
  // canonical state representation
  const canonical = r(state)
  if (ec.verify(canonical, ackSig, delta.they_pubkey)) {
    if (trace)
      l(`Successfully verified sig against state\n${ascii_state(state)}`)

    delta.sig = ackSig
    delta.signed_state = canonical
    return true
  } else {
    return false
  }
}

module.exports = {
  nextValidator: nextValidator,
  parseAddress: parseAddress,
  loadKFile: loadKFile,
  loadPKFile: loadPKFile,
  generateMonkeys: generateMonkeys,
  loadMonkeys: loadMonkeys,
  deltaVerify: deltaVerify,

  getSubchannel: getSubchannel,

  setupDirectories: setupDirectories,
  getInsuranceBetween: getInsuranceBetween,
  getInsuranceSumForUser: getInsuranceSumForUser,
  getUserByIdOrKey: getUserByIdOrKey,
  userAsset: userAsset,
  userPayDebts: userPayDebts,
  insuranceResolve: insuranceResolve,
  proposalExecute: proposalExecute,
  startDispute: startDispute,
  deltaVerify: deltaVerify
}
