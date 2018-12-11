// Flush all new transitions to state channel. Types:
/*
Payment lifecycles:
outward payments: addnew > addsent > addack > delack
inward payments: addack > delnew > delsent > delack

add - add outward hashlock
del - remove inward hashlock by providing secret or reason of failure

This module has 3 types of behavior:
regular flush: flushes ack with or without transitions
opportunistic flush: flushes only if there are any transitions (used after receiving empty ack response)
during merge: no transitions can be applied, otherwise deadlock could happen.

Always flush opportunistically, unless you are acking your direct partner who sent tx to you.
*/

module.exports = async (pubkey, opportunistic) => {
  await section(['use', pubkey], async () => {
    if (trace) l(`Started Flush ${trim(pubkey)} ${opportunistic}`)

    let ch = await Channel.get(pubkey)
    ch.last_used = ts()

    // an array of partners we need to ack or flush changes at the end of processing
    var flushable = []

    // indexOf doesn't work with Buffers
    let uniqFlushable = (add) => {
      if (flushable.find((f) => f.equals(add))) {
        //loff('Already scheduled for flush')
      } else {
        flushable.push(add)
      }
    }
    let all = []

    // fail all
    if (!me.sockets[ch.d.they_pubkey] || ch.d.status == 'disputed') {
      for (let t of ch.payments) {
        if (t.type + t.status == 'addnew') {
          t.type = 'del'
          t.status = 'ack'
          t.outcome_type = 'fail'
          await t.save()

          if (t.inward_pubkey) {
            inward_ch = await Channel.get(t.inward_pubkey)

            let to_fail = inward_ch.payments.find((p) => p.hash.equals(t.hash))
            to_fail.type = 'del'
            to_fail.status = 'new'
            to_fail.outcome_type = 'outcomeCapacity'
            to_fail.outcome = 'outcomeCapacity'
            await to_fail.save()

            me.metrics.fail.current++
          }
        }
      }
      return l('this channel is offline')
    }

    if (ch.d.status == 'sent') {
      if (trace) l(`End flush ${trim(pubkey)}, in sent`)

      if (ch.d.ack_requested_at < ts() - 4000) {
        //me.send(ch.d.they_pubkey, 'update', ch.d.pending)
      }
      return
    }

    if (ch.d.status == 'CHEAT_dontack') {
      return
    }

    // todo move this logic into the iteration
    if (ch.d.status == 'disputed') {
      return
    }

    let ackSig = ec(r(refresh(ch)), me.id.secretKey)

    // array of actions to apply to canonical state
    let transitions = []

    // merge cannot add new transitions because expects another ack
    // in merge mode all you do is ack last (merged) state
    if (ch.d.status == 'master') {
      // bank waits a bit in case destination returns secret quickly
      //if (me.my_bank && !opportunistic) await sleep(150)

      for (let t of ch.payments) {
        if (t.status != 'new') continue

        let derived = ch.derived[t.asset]
        let subch = ch.d.subchannels.by('asset', t.asset)

        if (t.type == 'del') {
          // remove a hashlock and provide either secret or reason of failure
          if (me.CHEAT_dontreveal) {
            loff('CHEAT: not revealing our secret to inward')
            continue
          }

          if (t.outcome_type == 'outcomeSecret') {
            subch.offdelta += ch.d.isLeft() ? t.amount : -t.amount
          }
          var args = [t.asset, t.hash, t.outcome_type, t.outcome]
        } else if (t.type == 'delrisk') {
          // works like refund
          //if (!t.secret) {
          subch.offdelta += ch.d.isLeft() ? -t.amount : t.amount
          //}

          //var args = [t.hash, t.secret]
        } else if (t.type == 'add' || t.type == 'addrisk') {
          if (
            t.lazy_until &&
            t.lazy_until > ts() &&
            t.amount > derived.uninsured
          ) {
            l('Still lazy, wait')
            continue
          }

          if (
            t.amount < K.min_amount ||
            t.amount > K.max_amount ||
            t.amount > derived.available ||
            derived.outwards.length >= K.max_hashlocks
          ) {
            if (trace)
              loff(
                `error cannot transit ${t.amount}/${derived.available}. Locks ${
                  derived.outwards.length
                }.`
              )

            if (me.my_bank && t.amount > derived.available) {
              me.textMessage(
                ch.d.they_pubkey,
                `Cant send ${t.amount} available ${
                  derived.available
                }, extend credit`
              )
            }

            me.metrics.fail.current++

            t.type = 'del'
            t.status = 'ack'

            await t.save()

            if (t.inward_pubkey) {
              var inward_ch = await Channel.get(t.inward_pubkey)
              var pull_hl = inward_ch.derived[t.asset].inwards.find((hl) =>
                hl.hash.equals(t.hash)
              )
              pull_hl.type = 'del'
              pull_hl.status = 'new'
              let reason = `${me.my_bank.id} to ${trim(ch.d.they_pubkey)}`

              pull_hl.outcome_type = 'outcomeCapacity'
              pull_hl.outcome = reason

              await pull_hl.save()

              uniqFlushable(inward_ch.d.they_pubkey)
            }

            continue
          }
          if (derived.outwards.length >= K.max_hashlocks) {
            loff('error Cannot set so many hashlocks now, try later')
            //continue
          }

          // set exp right before flushing to keep it fresh
          t.exp = K.usable_blocks + K.hashlock_exp

          args = [t.asset, t.amount, t.hash, t.exp, t.unlocker]
        }

        t.status = 'sent'

        await t.save()

        if (t.status != 'sent') {
          fatal('Gotcha error! ', t)
        }

        // increment nonce after each transition
        ch.d.dispute_nonce++

        let nextState = r(refresh(ch))

        transitions.push([
          t.type,
          args,
          ec(nextState, me.id.secretKey),
          nextState
        ])

        if (trace)
          l(
            `Adding a new ${t.type}, resulting state: \n${ascii_state(
              ch.state
            )}`
          )
      }

      if (opportunistic && transitions.length == 0) {
        if (trace) l(`End flush ${trim(pubkey)}: Nothing to flush`)
        return
      }
    } else if (ch.d.status == 'merge') {
      // important trick: only merge flush once to avoid bombing with equal acks
      if (opportunistic) return

      if (trace) l('In merge, no transactions can be added')
    }

    //only for debug, can be heavy
    let debug = [
      ch.d.signed_state, // signed state we have
      r(ch.state)
    ]

    // transitions: method, args, sig, new state
    let data = {
      method: 'update',
      ackSig: ackSig,
      transitions: transitions,
      debug: debug
    }

    if (transitions.length > 0) {
      // if there were any transitions, we need an ack on top
      ch.d.ack_requested_at = ts()
      //l('Set ack request ', ch.d.ack_requested_at, trim(pubkey))
      ch.d.pending = stringify(data)
      ch.d.status = 'sent'
      if (trace) l(`Flushing ${transitions.length} to ${trim(pubkey)}`)
    }
    await ch.d.save()
    for (let subch of ch.d.subchannels) {
      await subch.save()
    }

    me.send(ch.d.they_pubkey, data)

    return Promise.all(flushable.map((fl) => me.flushChannel(fl, true)))
  })
}
