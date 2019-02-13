const fs = require('fs')
const path = require('path')

// returns validator making block right now, use skip=true to get validator for next slot
const nextValidator = (skip = false) => {
  const currentIndex = Math.floor(Date.now() / K.blocktime) % K.total_shares

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

export function parseAddress(address) {
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










const getUserByIdOrKey = async function(id) {
  if (typeof id != 'number' && id.length != 32) {
    id = readInt(id)
  }

  let u = false

  

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


export const proposalExecute = async (proposal) => {
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
