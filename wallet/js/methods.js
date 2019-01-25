module.exports = {
  stream: () => {
    var n = 0
    var pay = () => {
      document.querySelector('.pay-now').click()
      if (n++ < 100) setTimeout(pay, 100)
    }
    pay()
  },

  pubkeyToUser: (pubkey) => {
    let h = app.K.banks.find((h) => h.pubkey == pubkey)
    return h ? h.handle : app.trim(pubkey)
  },

  resolveDemo: (democh) => {
    // normalize
    for (let arg of [
      'ins_ondelta',
      'ins_balance',
      'offdelta',
      'credit',
      'they_credit'
    ]) {
      if (Number.isInteger(parseInt(democh[arg]))) {
        democh[arg] = parseInt(democh[arg])
      } else {
        l(arg)
        return false
      }
    }

    let delta = democh.offdelta + democh.ins_ondelta
    let insurance = democh.ins_balance

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
      parts.they_uninsured +
      parts.uninsured +
      parts.they_insured +
      parts.insured

    if (total < 100) total = 100

    var bar = (amount, symbol) => {
      if (amount > 0) {
        return Array(1 + Math.ceil((amount * 100) / total)).join(symbol)
      } else {
        return ''
      }
    }

    // visual representations of state in ascii and text
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

    parts.available = delta + democh.they_credit

    parts.they_available = insurance + democh.credit - delta

    parts.min_offdelta = -democh.ins_ondelta - democh.they_credit

    parts.max_offdelta =
      -democh.ins_ondelta + democh.ins_balance + democh.credit

    parts.width = (parts.max_offdelta - parts.min_offdelta) * 5

    return parts
  },

  ivoted: (voters) => {
    return voters.find((v) => v.id == app.record.id)
  },

  updateRoutes: () => {
    if (app.outward.address.length < 4) return

    // address or amount was changed - recalculate best offered routes
    app.call('getRoutes', {
      address: app.outward.address,
      amount: app.outward.amount,
      asset: app.outward.asset
    })
  },

  routeToText: (r) => {
    let info = []

    for (let hop of r[1]) {
      let bank = app.K.banks.find((h) => h.id == hop)
      if (bank) {
        //(${app.bpsToPercent(bank.fee_bps)})
        info.push(`${app.to_user(bank.id)}`)
      }
    }

    return info.join(' → ')
  },

  bpsToPercent: (p) => {
    return app.commy(p, true, false) + '%'
  },

  skipDate: (h, index) => {
    // if previous timestamp has same date, don't show it
    var str = new Date(h.createdAt).toLocaleString()
    if (index == 0) app.skip_prev_date = false

    /*if (app.skip_prev_date && str.startsWith(app.skip_prev_date)) {
      app.skip_prev_date = str.split(', ')[0]
      return '' //str.split(', ')[1]
    } else {*/
    app.skip_prev_date = str.split(', ')[0]
    //str.split(', ')[1] +
    return '<b>' + str.split(', ')[0] + '</b>'
    //}
  },

  toHexString: (byteArray) => {
    return Array.prototype.map
      .call(byteArray, function(byte) {
        return ('0' + (byte & 0xff).toString(16)).slice(-2)
      })
      .join('')
  },

  requestInsurance: (ch, asset) => {
    if (!app.record && asset != 1) {
      alert(
        `You can't have insurance in non-FRD assets now, ${
          app.onchain
        } registration is required. Request insurance in FRD asset first.`
      )
      return
    }

    if (
      confirm(
        app.record
          ? `Increasing insurance in ${app.onchain} costs a fee, continue?`
          : `You will be charged ${app.commy(
              app.K.account_creation_fee
            )} for registration, and ${app.commy(
              app.K.standalone_balance
            )} will be sent to your ${app.onchain} account. Continue?`
      )
    ) {
      app.call('withChannel', {
        method: 'requestInsurance',
        they_pubkey: ch.d.they_pubkey,
        asset: asset
      })
    }
  },

  call: function(method, args = {}) {
    if (method == 'vote') {
      args.rationale = prompt('Why?')
      if (!args.rationale) return false
    }

    FS(method, args).then(render)
    return false
  },

  addExternalDeposit: () => {
    let d = app.outward
    app.call('externalDeposit', {
      asset: d.asset,
      amount: app.uncommy(d.amount),
      bank: d.bank,
      address: d.address
    })
    //app.resetOutward()
  },

  resetOutward: () => {
    // reset all formfields
    app.outward = {
      address: '',
      amount: '',
      asset: 1,
      type: app.outward.type,
      bank: -1
    }
  },

  estimate: (f) => {
    if (f) {
      app.order.rate = (app.asset > app.order.buyAssetId
        ? app.order.buyAmount / app.order.amount
        : app.order.amount / app.order.buyAmount
      ).toFixed(6)
    } else {
      app.order.buyAmount = (app.asset > app.order.buyAssetId
        ? app.order.amount * app.order.rate
        : app.order.amount / app.order.rate
      ).toFixed(6)
    }
  },

  buyAmount: (d) => {
    return (
      (d.assetId > d.buyAssetId ? d.amount * d.rate : d.amount / d.rate) / 100
    )
  },

  to_ticker: (assetId) => {
    let asset = app.assets ? app.assets.find((a) => a.id == assetId) : null

    return asset ? asset.ticker : 'N/A'
  },

  to_user: (userId) => {
    // returns either bank name or just id
    // todo: twitter-style tooltips with info on the user

    let h = app.K.banks.find((h) => h.id == userId)
    //`<span class="badge badge-success">${h.handle}</span>`
    return h ? h.handle : userId
  },

  getAsset: (asset, user) => {
    if (!user) user = app.record
    if (!user) return 0

    let b = user.balances.find((b) => b.asset == asset)

    if (b) {
      return b.balance
    } else {
      return 0
    }
  },

  showGraph: () => {
    if (!window.bankgraph) return

    drawHubgraph({
      nodes: app.K.banks.map((h) => {
        return {id: h.id, handle: h.handle, group: 1}
      }),
      links: app.K.routes.map((r) => {
        return {source: r[0], target: r[1], value: 1}
      })
    })
  },

  go: (path) => {
    var authed = ['wallet', 'transfer', 'onchain', 'testnet']

    //if (authed.includes(path) && !localStorage.auth_code) path = ''

    if (path == '') {
      history.pushState('/', null, '/')
    } else {
      location.hash = '#' + path
    }

    app.tab = path
  },

  paymentToDetails: (h) => {
    let ch = app.channels.find((ch) => {
      return ch.d.id == h.channelId
    })
    if (!ch) return 'no'

    if (h.is_inward) {
      return `From ${h.source_address ? app.trim(h.source_address) : 'N/A'}`
    } else {
      return `To ${
        h.destination_address ? app.trim(h.destination_address) : 'N/A'
      }`
    }
  },

  elaborateAvailable: (obj) => {
    let str = []
    let c = app.commy

    if (obj.available_credit > 0)
      str.push('available credit ' + c(obj.available_credit))
    if (obj.insured > 0) str.push('insured ' + c(obj.insured))
    if (obj.uninsured > 0) str.push('uninsured ' + c(obj.uninsured))

    if (str.length > 0) {
      // show insured+uninsured+available credit
      str = str.join(' + ')
      // add -hold amount
      if (obj.outwards_hold > 0) str += ' - hold ' + c(obj.outwards_hold)

      return ` (${str})`
    } else {
      return ''
    }
  },

  dispute_outcome: (ins, outcomes) => {
    let c = app.commy
    let o = ''

    var sep = ' | '

    if (outcomes) {
      for (let parts of outcomes) {
        // skip if nothing happened
        if (
          parts.uninsured +
            parts.they_uninsured +
            parts.insured +
            parts.they_insured ==
          0
        )
          continue

        o += ` ${app.to_ticker(parts.asset)} `

        if (parts.uninsured > 0) {
          o += `${c(parts.insured)} + ${c(parts.uninsured)}${sep}0`
        } else if (parts.they_uninsured > 0) {
          o += `0${sep}${c(parts.they_insured)} + ${c(parts.they_uninsured)}`
        } else {
          o += `${parts.insured > 0 ? c(parts.insured) : '0'}${sep}${
            parts.they_insured > 0 ? c(parts.they_insured) : '0'
          }`
        }
      }
    }

    return `(${app.to_user(ins.leftId)}) ${o} (${app.to_user(ins.rightId)})`
  },

  uncommy: (str) => {
    str = str.toString()
    if (str == '' || !str) return 0
    //if (str.indexOf('.') == -1) str += '.00'

    // commas are removed as they are just separators
    str = str.replace(/,/g, '')

    return Math.round(parseFloat(str) * 100)

    //parseInt(str.replace(/[^0-9]/g, ''))
  },

  timeAgo: (time) => {
    var units = [
      {
        name: 'second',
        limit: 60,
        in_seconds: 1
      },
      {
        name: 'minute',
        limit: 3600,
        in_seconds: 60
      },
      {
        name: 'hour',
        limit: 86400,
        in_seconds: 3600
      },
      {
        name: 'day',
        limit: 604800,
        in_seconds: 86400
      },
      {
        name: 'week',
        limit: 2629743,
        in_seconds: 604800
      },
      {
        name: 'month',
        limit: 31556926,
        in_seconds: 2629743
      },
      {
        name: 'year',
        limit: null,
        in_seconds: 31556926
      }
    ]
    var diff = (new Date() - new Date(time)) / 1000
    if (diff < 5) return 'now'

    var i = 0,
      unit
    while ((unit = units[i++])) {
      if (diff < unit.limit || !unit.limit) {
        var diff = Math.floor(diff / unit.in_seconds)
        return diff + ' ' + unit.name + (diff > 1 ? 's' : '') + ' ago'
      }
    }
  },

  t: window.t,

  toggle: () => {
    if (localStorage.settings) {
      delete localStorage.settings
    } else {
      localStorage.settings = 1
    }

    app.settings = !app.settings
  },

  ts: () => Math.round(new Date()),

  prettyBatch: (batch) => {
    let r = ''
    for (let tx of batch) {
      l(tx)
      if (['withdraw', 'deposit'].includes(tx[0])) {
        let capital = tx[0][0].toUpperCase() + tx[0].slice(1)
        r += `<span class="badge badge-dark">${capital} ${app.to_ticker(
          tx[1][0]
        )}</span>&nbsp;`

        for (let o of tx[1][1]) {
          if (tx[0] == 'withdraw') {
            r += `<span class="badge badge-danger">${app.commy(
              o[0]
            )} from ${app.to_user(o[1])}</span>&nbsp;`
          } else {
            r += `<span class="badge badge-success">${app.commy(
              o[0]
            )} to ${app.to_user(o[1])}</span>&nbsp;`
          }
        }
      } else {
        r += `<span class="badge badge-danger">${tx[0]}</span>&nbsp;`
      }
    }
    return r
  },

  prompt: (a) => {
    return window.prompt(a)
  },

  getAuthLink: () => {
    return location.origin + '#auth_code=' + app.auth_code
  },

  trim: (str) => {
    return str ? str.slice(0, 8) + '...' : ''
  },
  payment_status: (t) => {
    var s = ''
    if (t.type == 'del' || t.type == 'delrisk') {
      //outcomeSecret ✔
      s = t.outcome_type == 'outcomeSecret' ? '' : '❌ '
    }
    if (t.type == 'add' || t.type == 'addrisk') {
      s = '🔒'
    }
    // new and sent are considered "pending" statuses
    return s + (['ack', 'processed'].includes(t.status) ? '' : '🕟')
  }
}
