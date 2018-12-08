module.exports = async (json) => {
  // why would we be asked to add batch to block?
  if (!me.my_validator) return false

  //if (me.my_validator == nextValidator(true)) {
  r(fromHex(json.data)).map((batch) => {
    me.mempool.push(batch)
  })
  //} else {
  //  me.send(nextValidator(true), 'add_batch', msg)
  //}
}
