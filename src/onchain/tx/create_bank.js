const Router = require('../../router')

module.exports = async (s, args) => {
  // not enabled yet
  return

  let json = parse(args.toString())

  if (!json.handle) return false

  json.fee_bps = parseInt(json.fee_bps)
  if (json.fee_bps > 500) return false

  let bank = K.banks.find((h) => h.handle == json.handle)

  // trying to modify someone else's bank
  if (bank && bank.id != s.signer.id) return false

  if (!bank) {
    // create new bank
    bank = {
      id: s.signer.id,
      location: json.location,
      pubkey: toHex(s.signer.pubkey),
      box_pubkey: json.box_pubkey,

      website: json.website,
      // basis points
      fee_bps: json.fee_bps,

      handle: json.handle,
      name: json.handle,

      createdAt: K.ts
    }

    K.banks.push(bank)

    if (me.record && me.record.id == s.signer.id) {
      // we just started our own bank
      me.my_bank = bank
      Periodical.startBank()
    } else {
      // start trusting new bank automatically
      require('../../internal_rpc/with_channel')({
        op: 'setLimits',
        they_pubkey: bank.pubkey,
        asset: 1,
        rebalance: K.rebalance,
        credit: K.credit
      })
    }
  }

  if (json.add_routes) {
    json.add_routes.map((r) => {
      Router.addRoute(bank.id, parseInt(r))
    })
  }

  if (json.remove_routes) {
    json.remove_routes.map((r) => {
      Router.removeRoute(bank.id, parseInt(r))
    })
  }

  s.parsed_tx.events.push(['createBank', json.handle])
}
