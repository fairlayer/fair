// This method gets Insurance from onchain db, Channel from offchain db
// then derives a ton of info about current channel: (un)insured balances

class WrappedChannel {
  constructor() {}

  //toJSON(){}
}

// TODO: periodically clone Insurance to Channel db to only deal with one db having all data
module.exports = async (pubkey, doRefresh = true) => {
  // this critical section protects from simultaneous getChannel and doublesaved db records
  return await section(['get', pubkey], async () => {
    if (!me.pubkey) {
      return false
    }

    let ch

    if (typeof pubkey == 'string') pubkey = fromHex(pubkey)

    var key = stringify([pubkey])
    /*
    if (cache.ch[key]) {
      if (doRefresh) refresh(cache.ch[key])
      return cache.ch[key]
    }*/

    //l('Loading channel from db: ', key)

    if (me.pubkey.equals(pubkey)) {
      l('Channel to self?')
      return false
    }

    /*      online:
        me.sockets[pubkey] &&
        (me.sockets[pubkey].readyState == 1 ||
          (me.sockets[pubkey].instance &&
            me.sockets[pubkey].instance.readyState == 1))

*/

    ch = {} //new WrappedChannel()
    ch.derived = {}

    ch.last_used = ts() // for eviction from memory

    /*
      let defaults = {}

      if (me.my_bank) {
        defaults.they_rebalance = K.rebalance
        defaults.they_credit = K.credit
      }
      if (my_bank(pubkey)) {
        defaults.rebalance = K.rebalance
        defaults.credit = K.credit
      }
      */

    ch.d = await Channel.findOne({
      where: {
        they_pubkey: pubkey
      },
      include: [Subchannel]
    })

    if (!ch.d) {
      loff(`Creating new channel ${trim(pubkey)}`)

      ch.d = await Channel.create(
        {
          they_pubkey: pubkey,
          status: 'merge', // wait for initial ack
          subchannels: [
            {
              asset: 1
            },
            {
              asset: 2
            }
          ]
        },
        {include: [Subchannel]}
      )
      //l('New one', ch.d.subchannels)
    } else {
      //l('Found old channel ', ch.d.subchannels)
    }

    let user = await User.findOne({where: {pubkey: pubkey}, include: [Balance]})

    if (user && user.id) {
      ch.partner = user.id
      if (me.record) {
        ch.ins = await getInsuranceBetween(me.record, user)
      }
    }

    ch.payments = await Payment.findAll({
      where: {
        channelId: ch.d.id,
        // delack is archive
        [Op.or]: [{type: {[Op.ne]: 'del'}}, {status: {[Op.ne]: 'ack'}}]
      },
      limit: 3000,
      // explicit order because of postgres https://gitbank.com/sequelize/sequelize/issues/9289
      order: [['id', 'ASC']]
    })

    if (doRefresh) refresh(ch)

    //cache.ch[key] = ch
    //l('Saved in cache ', key)
    return ch
  })
}
