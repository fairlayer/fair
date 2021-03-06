// Fairlayer runs e2e tests on itself,
// different nodes acting like "monkeys" and doing different overlapping scenarios

const payMonkey = async (on_server, counter = 1) => {
  var parsedAddress = false
  while (!parsedAddress) {
    parsedAddress = await parseAddress(monkeys.randomElement())
    if (me.is_me(parsedAddress.pubkey)) parsedAddress = false
  }

  // offchain payment

  await me.payChannel({
    address: parsedAddress.address,
    amount: 100 + Math.round(Math.random() * 200),
    asset: 1
  })

  const reg = await getUserByIdOrKey(parsedAddress.pubkey)

  // onchain payment (batched, not sent to validator yet)
  me.batchAdd('deposit', [
    1,
    [
      Math.round(Math.random() * 1000),
      reg.id ? reg.id : parsedAddress.pubkey,
      0
    ]
  ])

  // run on server infinitely and with longer delays
  // but for local tests limit requests and run faster
  if (on_server) {
    // replenish with testnet faucet once in a while

    setTimeout(() => {
      payMonkey(on_server, counter + 1)
    }, Math.round(500 + Math.random() * 9000))
  } else if (counter < 6) {
    setTimeout(() => {
      payMonkey(on_server, counter + 1)
    }, 300)
  }
}

let run = async () => {
  if (base_port > 8000) {
    // add first bank by default and open limit
    //PK.usedBanks.push(1)

    setTimeout(() => {}, 4000)
  }

  // only in monkey mode, not on end user node

  if (base_port != 8008) {
    Periodical.schedule('broadcast', K.blocktime)
  }

  if (base_port > 8000 && base_port < 8500) {
    monkeys.splice(monkeys.indexOf(me.getAddress()), 1) // *except our addr

    setTimeout(async () => {
      // ensure 1st bank node is up already
      await sleep(2000)

      await require('../src/internal_rpc/with_channel')({
        method: 'setLimits',
        they_pubkey: K.banks[0].pubkey,
        asset: 1,
        rebalance: K.rebalance,
        credit: K.credit
      })

      await sleep(3000)

      me.send(K.banks[0].pubkey, {
        method: 'testnet',
        action: 'faucet',
        asset: 1,
        amount: 500000,
        address: me.getAddress()
      })

      l('Requesting faucet to ' + me.getAddress())

      if (me.record && me.record.id == 2) {
        // withdraw 12.34 from bank and deposit 9.12 to 3 @ 1
        let ch = await Channel.get(K.banks[0].pubkey)

        let withdrawn = await require('../src/internal_rpc/with_channel')({
          method: 'withdraw',
          they_pubkey: toHex(ch.d.they_pubkey),
          asset: 1,
          amount: 1234
        })

        require('../src/internal_rpc/external_deposit')({
          asset: 1,
          userId: 3,
          bank: 1,
          amount: 1234
        })
      }
    }, K.blocktime)

    setTimeout(() => {
      payMonkey(on_server)

      // intended to fail

      me.payChannel({
        address:
          'BummA99ygBEKX5pwxQdjgwLuBWUe1J3y83PgG4UUPRVeBLcq9z1MvbGwCVywazybHj3cazHohFMkhxhako7xmRU4t7cZSSSC#FAIL',
        amount: 100,
        asset: 1
      }).then(console.log)
    }, 20000)
  }

  // below go pre-registred users
  if (!me.record || me.record.id > 10) {
    return
  }

  if (me.record.id == 1) {
    l('Scheduling e2e checks')
    // after a while the bank checks environment, db counts etc and test fails if anything is unexpected
    setTimeout(async () => {
      // no need to run test on server
      if (on_server) return

      await Periodical.syncChanges()

      let monkey5 = await getUserByIdOrKey(5)
      let monkey5ins = await getInsuranceSumForUser(5)

      // must be >100 after expected rebalance

      let failed = []

      if (me.metrics.settle.total == 0) failed.push('metrics.settled')
      if (me.metrics.fail.total == 0) failed.push('metrics.failed')
      if ((await Payment.count()) == 0) failed.push('payments')

      // was this entirely new user created since genesis?
      if (!monkey5) failed.push('monkey5')

      //if (monkey5ins < 100) failed.push('monkey5insurance')

      if ((await Block.count()) < 2) failed.push('blocks')
      if ((await Channel.count()) < 5) failed.push('deltas')

      let e2e = 'e2e: ' + (failed.length == 0 ? 'success' : failed.join(', '))
      l(e2e)

      Raven.captureMessage(e2e, {
        level: 'info'
      })

      child_process.exec(`osascript -e 'display notification "${e2e}"'`)

      if (failed.length != 0) {
        //fatal(0)
      }

      //
    }, 80000)

    // adding onchain balances to monkeys
    for (var dest of monkeys) {
      let [pubkey, box_pubkey] = r(base58.decode(dest))
      if (pubkey.length < 6) pubkey = readInt(pubkey)
      me.batchAdd('deposit', [1, [1000000, pubkey, 0]])
    }
  }

  if (me.record.id == 4) {
    // trigger the dispute from bank
    
    //me.CHEAT_dontack = true
    me.CHEAT_dontwithdraw = true

    setTimeout(() => {
      me.payChannel({
        amount: 20000,
        address: monkeys[0],
        asset: 1
      })
    }, 12000)
  }
}

if (argv.monkey) {
  run()
}
