// cache layer stores most commonly edited records:
// channels, payments, users and insurances
// also K.json is stored
module.exports = async (opts = {}) => {
  me.metrics.syncChanges.current++

  if (ts() - me.last_sync_changes < 10000) {
    return
  }
  me.last_sync_changes = ts()

  return await section('syncChanges', async () => {
    var all = []

    if (K) {
      let K_dump = stringify(K)

      // rewrite only if changed
      if (K_dump != cache.last_K_dump) {
        fs.writeFileSync(
          require('path').resolve(
            __dirname,
            '../../' + datadir + '/onchain/k.json'
          ),
          K_dump,
          function(err) {
            if (err) return console.log(err)
          }
        )
        cache.last_K_dump = K_dump
      }
    }

    // saving all deltas and corresponding payment objects to db
    // it only saves changed() records, so call save() on everything

    /*

    for (var key in cache.users) {
      var u = cache.users[key]

      if (u.id && u.changed()) {
        all.push(u.save())
      }
    }

    if (opts.flush == 'users') cache.users = {}

    for (var key in cache.ins) {
      var u = cache.ins[key]

      if (u.id && u.changed()) {
        all.push(u.save())
      }
    }

    for (let key in cache.ch) {
      //await section(['get', cache.ch[key].d.they_pubkey], async () => {
      await section(['use', cache.ch[key].d.they_pubkey], async () => {
        let ch = cache.ch[key]

        // sync all Channel, Subchannel, Payments

        //return false
        let promises = []

        //if (ch.d.changed()) {
        promises.push(ch.d.save())
        //}

        //l('Saving subch: ', ch.d.subchannels.length)
        for (let subch of ch.d.subchannels) {
          //if (ch.d.subchannels[i].changed()) {
          //subch.channelId = ch.d.id

          //l('Saving subch... ', subch)
          promises.push(subch.save())
          //}
        }
        // Ensure: payments must be garbage collected!
        //let left_payments = []
        for (let i = 0; i < ch.payments.length; i++) {
          let t = ch.payments[i]
          //t.channelId = ch.d.id
          //await t.save()

          //if (t.changed()) {
          promises.push(t.save())
          l(`Saving ${t.type + t.status} ${trim(t.hash)}`)
          //}

          // delacked payments are of no interest anymore
          if (t.type + t.status != 'delack') {
            //left_payments.push(t)
            //delete ch.payments[i]
            //ch.payments.splice(i, 1)
            //i -= 1
          }
        }
        //ch.payments = left_payments

        let evict = ch.last_used < ts() - 2000
        //K.cache_timeout

        await Promise.all(promises)

        // the channel is only evicted after it is properly saved in db
        // Our job is to ensure after eviction channel in db has same structure
        if (evict) {
          delete cache.ch[key]
          //promise = promise.then(() => {
          l('Evict idle ch: ' + trim(ch.d.they_pubkey))
          //})
        }

        //all.push(promise)
      })
      //})
    }
    */

    //if (all.length > 0) {
    //l(`syncChanges done: ${all.length}`)
    //}

    return await Promise.all(all)
  })
}
