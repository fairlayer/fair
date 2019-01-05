module.exports = () => {
  me.status = 'precommit'

  // gossip your precommits if have 2/3+ prevotes or nil

  // do we have enough prevotes?
  let shares = 0
  K.validators.map((c, index) => {
    if (PK['prevote_' + c.id]) {
      shares += c.shares
    }
  })

  // lock on this block. Unlock only if another block gets 2/3+
  if (shares >= K.majority) {
    PK.locked_block = me.proposed_block
  }

  let proof = me.block_envelope(
    methodMap('precommit'),
    PK.locked_block ? PK.locked_block.header : 0,
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
