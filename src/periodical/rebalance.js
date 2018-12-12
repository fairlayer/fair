/*
The most important job of the bank is to rebalance assets once in a while.
1. the bank finds who wants to insure their uninsured balances. They can learn automatically (given soft limit) or manually (Request Insurance in the wallet)
2. now the bank tries to find the total amount of insurance needed from the net-spenders who are currently online
3. it's up to the alg implementation to start disputes with net-spenders who are offline for too long
4. if bank fails to find enough net-spenders right now, they may drop some low value or high value net-receivers to match the numbers on both sides
5. packs withdrawals and deposits into one large rebalance batch and broadcasts onchain

Current implementation is super simple and straightforward. There's huge room for improvement:
* smart learning based on balances over time not on balance at the time of matching
* use as little withdrawals/deposits to transfer as much as possible volume
* have different schedule for different assets, e.g. rebalance FRD every 1 block but rare assets every 1k blocks
* often bank needs to request insurance from another bank (cross-bank payments).

General recommendations:
1. assets stuck in a dispute is a waste. It's better to do everything by mutual agreement as much as possible, w/o suffering dispute delays and locked up liquidity
2. the bank must store as little funds on their @onchain balances as possible. So once bank withdraw from net-spenders they should immediately deposit it to net-receiver.

*/

const withdraw = require('../offchain/withdraw')

module.exports = async function() {
  if (PK.pending_batch || me.batch.length > 0) {
    return //l('There are pending tx')
  }

  var deltas = await Channel.findAll()

  // we request withdrawals and check in few seconds for them
  let netSpenders = []
  let netReceivers = []

  let minRisk = 500

  for (let asset = 1; asset <= 2; asset++) {
    for (let d of deltas) {
      await section(['use', d.they_pubkey], async () => {
        let ch = await Channel.get(d.they_pubkey)
        let derived = ch.derived[asset]
        let subch = ch.d.subchannels.by('asset', asset)

        if (!derived) {
          l('No derived', ch)
        }

        // finding who has uninsured balances AND
        // requests insurance OR gone beyond soft limit
        if (
          derived.they_uninsured > 0 &&
          (subch.they_requested_insurance ||
            (subch.they_rebalance > 0 &&
              derived.they_uninsured >= subch.they_rebalance))
        ) {
          //l('Adding output for our promise ', ch.d.they_pubkey)
          netReceivers.push(ch)
        } else if (derived.insured >= minRisk) {
          if (me.sockets[ch.d.they_pubkey]) {
            // they either get added in this rebalance or next one
            //l('Request withdraw withdraw: ', derived)
            netSpenders.push(withdraw(ch, subch, derived.insured))
          } else if (subch.withdrawal_requested_at == null) {
            l('Delayed pull')
            subch.withdrawal_requested_at = ts()
          } else if (subch.withdrawal_requested_at + 600000 < ts()) {
            l('User is offline for too long, or tried to cheat')
            me.batchAdd('dispute', await startDispute(ch))
          }
        }
      })
    }

    // checking on all withdrawals we expected to get, then rebalance
    netSpenders = await Promise.all(netSpenders)

    // 1. how much we own of this asset

    let weOwn = me.record ? userAsset(me.record, asset) : 0

    // 2. add all withdrawals we received
    for (let ch of netSpenders) {
      let subch = ch.derived[asset].subch
      if (subch.withdrawal_sig) {
        weOwn += subch.withdrawal_amount
        let user = await User.findOne({
          where: {pubkey: ch.d.they_pubkey},
          include: [Balance]
        })

        me.batchAdd('withdraw', [
          subch.asset,
          [subch.withdrawal_amount, user.id, subch.withdrawal_sig]
        ])
      } else {
        // offline? dispute
        subch.withdrawal_requested_at = ts()
      }
    }

    // 3. debts will be enforced on us (if any), so let's deduct them beforehand
    let debts = await me.record.getDebts({where: {asset: asset}})
    for (let d of debts) {
      weOwn -= d.amount_left
    }

    // sort receivers, larger ones are given priority
    netReceivers.sort(
      (a, b) =>
        b.derived[asset].they_uninsured - a.derived[asset].they_uninsured
    )

    // dont let our FRD onchain balance go lower than that
    let safety = asset == 1 ? K.bank_standalone_balance : 0

    // 4. now do our best to cover net receivers
    for (let ch of netReceivers) {
      weOwn -= ch.derived[asset].they_uninsured
      if (weOwn >= safety) {
        me.batchAdd('deposit', [
          asset,
          [ch.derived[asset].they_uninsured, me.record.id, ch.d.they_pubkey, 0]
        ])

        // nullify their insurance request
        ch.derived[asset].subch.they_requested_insurance = false
      } else {
        l(
          `Run out of funds for asset ${asset}, own ${weOwn} need ${
            ch.derived[asset].they_uninsured
          }`
        )
        break
      }
    }
  }
}
