const mongoose = require('mongoose')

const errorSchema = new mongoose.Schema({
  name: { type: String, default: 'Unknown Error' },
  message: { type: String, default: 'No error message provided' },
  stack: [String],
  others: Object,
  status: Number,
  createdAt: { type: Date, default: Date.now }
})

module.exports = mongoose.model('Error', errorSchema)
