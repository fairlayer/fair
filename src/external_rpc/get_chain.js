// extracts chain starting at start_block
module.exports = async (json, ws) => {
  let start = parseInt(json.start_block)
  let limit = parseInt(json.limit)
  if (limit > 1000) limit = 1000

  let block_records = await Block.findAll({
    attributes: ['id', 'round', 'precommits', 'header', 'ordered_tx_body'],
    where: {
      id: {[Op.gt]: start}
    },
    order: [['id', 'ASC']],
    limit: limit
  })

  if (block_records[0] && block_records[0].id == start + 1) {
    return block_records.map((b, index) => {
      // include precommits in the last one, not in each
      return [
        b.round,
        json.include_precommits || index + 1 == block_records.length
          ? r(b.precommits)
          : null,
        b.header,
        b.ordered_tx_body
      ]
    })
  } else {
    return []
  }
}
