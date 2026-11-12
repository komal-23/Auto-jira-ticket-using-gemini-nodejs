const mongoose = require('mongoose')

const chmLogsSchema = new mongoose.Schema({
  channel_id: { type: String },
  type: { type: String },
  log_ids: [{ type: String }],
  property: [{ type: Number }],
  status: { type: String },
  Request:[{ type: Array }],
  Response:[{ type: Array }]
}, {
  collection: 'chm_logs'
})

module.exports = mongoose.model('CHMLogs', chmLogsSchema)