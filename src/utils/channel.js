// Defines how payment channels work, based on "insurance" and delta=(ondelta+offdelta)
// There are 3 major scenarios of delta position
// . is 0 point, | is delta, = is insured, - is uninsured
// 4,6  .====--| (left user owns entire insurance, has 2 uninsured)
// 4,2  .==|==   (left and right both have 2 insured)
// 4,-2 |--.==== (right owns entire insurance, 2 in uninsured balance)
// https://codepen.io/anon/pen/wjLGgR visual demo
resolveChannel = (insurance, delta, is_left = true) => {
  if (!Number.isInteger(insurance) || !Number.isInteger(delta)) {
    l(insurance, delta)
    throw 'Not integer'
  }

  var parts = {
    // left user promises only with negative delta, scenario 3
    they_uninsured: delta < 0 ? -delta : 0,
    insured: delta > insurance ? insurance : delta > 0 ? delta : 0,
    they_insured:
      delta > insurance ? 0 : delta > 0 ? insurance - delta : insurance,
    // right user promises when delta > insurance, scenario 1
    uninsured: delta > insurance ? delta - insurance : 0
  }

  var total =
    parts.they_uninsured + parts.uninsured + parts.they_insured + parts.insured

  if (total < 100) total = 100

  var bar = (amount, symbol) => {
    if (amount > 0) {
      return Array(1 + Math.ceil((amount * 100) / total)).join(symbol)
    } else {
      return ''
    }
  }

  // visual representations of state in ascii and text
  /*
  if (delta < 0) {
    parts.ascii_channel =
      '|' + bar(parts.they_uninsured, '-') + bar(parts.they_insured, '=')
  } else if (delta < insurance) {
    parts.ascii_channel =
      bar(parts.insured, '=') + '|' + bar(parts.they_insured, '=')
  } else {
    parts.ascii_channel =
      bar(parts.insured, '=') + bar(parts.uninsured, '-') + '|'
  }
  */

  // default view is left. if current user is right, simply reverse
  if (!is_left) {
    ;[
      parts.they_uninsured,
      parts.insured,
      parts.they_insured,
      parts.uninsured
    ] = [
      parts.uninsured,
      parts.they_insured,
      parts.insured,
      parts.they_uninsured
    ]
  }

  return parts
}

const paymentToLock = (payment) => {
  return [payment.amount, payment.hash, payment.exp]
}

refresh = function(ch) {
  // Canonical state.
  // To be parsed in case of a dispute onchain
  ch.state = [
    methodMap('dispute'),
    [
      ch.d.isLeft() ? me.pubkey : ch.d.they_pubkey,
      ch.d.isLeft() ? ch.d.they_pubkey : me.pubkey,
      ch.d.dispute_nonce
    ],
    // assetId, offdelta, leftlocks, rightlocks
    []
  ]

  for (let subch of ch.d.subchannels) {
    let out = {
      inwards: [],
      outwards: [],
      inwards_hold: subch.they_withdrawal_amount,
      outwards_hold: subch.withdrawal_amount,
      asset: subch.asset,
      subch: subch
    }
    // find the according subinsurance for subchannel
    let subins
    if (ch.ins && ch.ins.subinsurances) {
      subins = ch.ins.subinsurances.by('asset', subch.asset)
    }
    if (!subins) subins = {balance: 0, ondelta: 0}

    // hashlock creates hold-like assets in limbo. For left and right user:

    for (let i = 0; i < ch.payments.length; i++) {
      let t = ch.payments[i]

      if (t.asset != subch.asset) continue

      var typestatus = t.type + t.status
      let in_state = [
        'addack',
        'delnew',
        ch.d.rollback_nonce > 0 ? 'delsent' : 'addsent'
      ]

      if (in_state.includes(typestatus)) {
        if (t.is_inward) {
          out.inwards.push(t)
          out.inwards_hold += t.amount
        } else {
          out.outwards.push(t)
          out.outwards_hold += t.amount
        }
      }
    }

    // we must "hold" withdrawal proofs on state even before they hit blockchain
    // otherwise the attacker can get a huge withdrawal proof, then send money offchain,
    // then steal the rest with withdrawal proof onchain, doubling their money
    // what we are about to withdraw and they are about to withdraw
    let ins_balance = subins.balance
    //ins_balance -= subch.withdrawal_amount + subch.they_withdrawal_amount

    // TODO: is it correct?
    //delta minus what Left one is about to withdraw (it's either we or they)
    let delta = subins.ondelta + subch.offdelta
    /*
    delta -= ch.d.isLeft()
      ? subch.withdrawal_amount
      : subch.they_withdrawal_amount*/

    Object.assign(out, resolveChannel(ins_balance, delta, ch.d.isLeft()))

    // inputs are like bearer cheques and can be used any minute, so we deduct them
    out.available =
      out.insured +
      out.uninsured +
      subch.they_credit -
      out.they_uninsured -
      out.outwards_hold

    out.they_available =
      out.they_insured +
      out.they_uninsured +
      subch.credit -
      out.uninsured -
      out.inwards_hold

    if (out.available < 0 || out.they_available < 0) {
      l('Invalid availables', JSON.stringify(out, null, 4))
      //fatal('invalid outs')
    }

    // All stuff we show in the progress bar in the wallet
    out.bar =
      out.they_uninsured + out.insured + out.they_insured + out.uninsured

    ch.state[2].push([
      subch.asset,
      encodeSignedInt(subch.offdelta),
      out[ch.d.isLeft() ? 'inwards' : 'outwards'].map((t) => paymentToLock(t)),
      out[ch.d.isLeft() ? 'outwards' : 'inwards'].map((t) => paymentToLock(t))
    ])

    ch.derived[subch.asset] = out
  }

  // sort by assed Id
  ch.state[2].sort((a, b) => a[0] - b[0])

  ch.ascii_states = ascii_state(ch.state)
  if (ch.d.signed_state) {
    let st = r(ch.d.signed_state)
    prettyState(st)
    st = ascii_state(st)
    if (st != ch.ascii_states) {
      ch.ascii_states += st
    }
  }

  return ch.state
}

saveId = async function(obj) {
  // only save if it has no id now
  //if (!obj.id) {
  await obj.save()
  //}

  if (obj.balances) {
    for (let b of obj.balances) {
      b.userId = obj.id
      if (b.changed()) await b.save()
    }
  }

  if (obj.subinsurances) {
    for (let b of obj.subinsurances) {
      // create ref later
      b.insuranceId = obj.id
      //l('saved subins', b)

      if (b.changed()) await b.save()
    }
  }
}
