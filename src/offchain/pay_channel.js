const Router = require('../router')
// short helper to create a Payment on some delta and flush the channel right after it
module.exports = async (opts) => {
  return await section('pay', async () => {
    let secret = crypto.randomBytes(32)
    let hash = sha3(secret)
    let asset = parseInt(opts.asset)

    //l('Paying ', opts)

    if (!opts.address) {
      l('Error: No address ', opts)
      return 'Error: No address'
    }

    let addr = await parseAddress(opts.address)

    if (!addr) {
      l('Invalid address')
      return 'Invalid address'
    }

    // use user supplied private message, otherwise generate random tag
    // invoice inside the address takes priority
    if (addr.invoice || opts.private_invoice) {
      opts.private_invoice = concat(
        Buffer.from([1]),
        bin(addr.invoice ? addr.invoice : opts.private_invoice)
      )
    } else {
      opts.private_invoice = concat(Buffer.from([2]), crypto.randomBytes(16))
    }

    let amount = parseInt(opts.amount)

    // NaN
    if (!Number.isInteger(amount)) return 'NaN'

    if (!opts.chosenRoute) {
      if (me.my_bank && addr.banks.includes(me.my_bank.id)) {
        // just pay direct
        opts.chosenRoute = []
      } else {
        // by default choose the cheapest one
        let best = await Router.bestRoutes(opts.address, {
          amount: amount,
          asset: asset
        })
        if (!best[0]) {
          //l('No route found:', best, addr.banks)
          return 'No route found:'
        } else {
          // first is the cheapest
          opts.chosenRoute = best[0][1]
        }
      }
    } else {
      // unpack from 1_2_3
      opts.chosenRoute = opts.chosenRoute.split('_')
    }

    // 1. encrypt msg for destination that has final amount/asset etc and empty envelope
    let onion = encrypt_box_json(
      {
        amount: amount, // final amount
        asset: asset,

        // buffers are in hex for JSON
        secret: toHex(secret),
        private_invoice: toHex(opts.private_invoice),

        ts: ts(),
        source_address: opts.provideSource ? me.getAddress() : null
      },
      addr.box_pubkey
    )

    let nextHop = addr.pubkey

    // 2. encrypt msg for each hop in reverse order
    let reversed = opts.chosenRoute.reverse()
    for (let hop of reversed) {
      let bank = K.banks.find((h) => h.id == hop)

      amount = beforeFee(amount, bank)

      onion = encrypt_box_json(
        {
          asset: asset,
          amount: amount,
          nextHop: nextHop,

          unlocker: onion
        },
        fromHex(bank.box_pubkey)
      )

      nextHop = bank.pubkey
    }

    // 3. now nextHop is equal our first hop, and amount includes all fees
    //await section(['use', nextHop], async () => {
    let ch = await Channel.get(nextHop)
    if (!ch) {
      l('No channel to ', nextHop, asset)
      return 'No channel to '
    }

    let subch = ch.d.subchannels.by('asset', asset)
    let available = ch.derived[asset].available

    // 4. do we have enough available for this hop?
    if (amount > available) {
      if (me.my_bank) {
        // ask to increase credit
        me.textMessage(
          ch.d.they_pubkey,
          `Cannot send ${commy(amount)} when available is ${commy(
            available
          )}, extend credit`
        )
      }
      react({alert: `Not enough funds ${available}`})

      return 'No available'
    } else if (amount > K.max_amount) {
      react({alert: `Maximum payment is $${commy(K.max_amount)}`})
      return 'out of range'
    } else if (amount < K.min_amount) {
      react({alert: `Minimum payment is $${commy(K.min_amount)}`})
      return 'out of range'
    }

    let outward = Payment.build({
      channelId: ch.d.id,

      type: opts.addrisk ? 'addrisk' : 'add',
      status: 'new',
      is_inward: false,
      asset: asset,

      lazy_until: opts.lazy ? ts() + 30000 : null,

      amount: amount,
      hash: bin(hash),

      unlocker: onion,
      destination_address: addr.address,
      private_invoice: opts.private_invoice
    })

    await outward.save()

    ch.payments.push(outward)

    react({})

    me.flushChannel(nextHop, true)

    return 'sent'
  })
}
