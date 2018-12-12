const rebroadcast = (signed_batch) => {
  if (me.my_validator && me.my_validator == nextValidator(true)) {
    me.mempool.push(signed_batch)
  } else {
    me.send(nextValidator(true), {
      method: 'add_batch',
      data: r([signed_batch])
    })
  }
}

// signs and broadcasts
module.exports = async function(opts) {
  section('broadcast', async () => {
    if (PK.pendingBatchHex) {
      if (trace) l('Have pendingBatchHex, only 1 tx is supported')

      return
    }
    // TODO: make batch persistent on disk

    let estimated = await me.batch_estimate(opts)

    if (!estimated) return

    if (trace) l('Broadcasting now with batch_nonce ', estimated.batch_nonce)
    // saving locally to ensure it is added, and rebroadcast if needed
    PK.pendingBatchHex = toHex(estimated.signed_batch)

    rebroadcast(estimated.signed_batch)
    me.pendingBatch = me.batch
    me.batch = []

    /*
    if (me.my_validator && me.my_validator == nextValidator(true)) {
      me.mempool.push(estimated.signed_batch)
    } else {
      me.send(nextValidator(true), 'add_batch', r([estimated.signed_batch]))
    }
    */
  })
}
