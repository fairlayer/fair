// cache layer stores most commonly edited records:
// channels, payments, users and insurances
// also K.json is stored
module.exports = async (opts = {}) => {
  return section('syncChanges', async () => {
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

    var new_ch = {}

    for (let key in cache.ch) {
      let ch = cache.ch[key]

      await section(['use', ch.d.partnerId, ch.d.asset], async () => {
        ch.payments = ch.payments.filter(async (t) => {
          if (t.changed()) {
            //all.push(t.save())
            await t.save()
          }

          // filter out finalized ones
          return t.type + t.status != 'delack'
        })

        let evict = ch.last_used < ts() - K.cache_timeout

        if (ch.d.changed()) {
          all.push(ch.d.save())
        }

        // the channel is only evicted after it is properly saved in db
        /*if (evict) {
          //delete cache.ch[key]
          promise = promise.then(() => {
            //l('Evict: ' + trim(ch.d.partnerId), ch.d.ack_requested_at)
          })
        }*/

        //all.push(promise)
      })
    }

    //cache.ch = new_ch

    if (all.length > 0) l(`syncdb done: ${all.length}`)
    return await Promise.all(all)
  })
}
