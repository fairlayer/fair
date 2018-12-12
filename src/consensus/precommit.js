module.exports = () => {
  me.status = 'precommit'

  // gossip your precommits if have 2/3+ prevotes or nil

  // do we have enough prevotes?
  let shares = 0
  Validators.map((c, index) => {
    if (c.prevote) {
      shares += c.shares
    }
  })

  // lock on this block. Unlock only if another block gets 2/3+
  if (shares >= K.majority) {
    me.locked_block = me.proposed_block
  }

  let proof = me.block_envelope(
    methodMap('precommit'),
    me.locked_block ? me.locked_block.header : 0,
    me.current_round
  )

  if (me.CHEAT_dontprecommit) {
    l('We are in CHEAT and dont precommit ever')
    return
  }

  setTimeout(() => {
    me.sendAllValidators({
      method: 'precommit',
      proof: proof
    })
  }, K.gossip_delay)
}
