const mongoose = require('mongoose')

const names = require('../utils/names')

const birthdaySchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'A user must have a name']
  },
  month: {
    type: Number,
    min: 1,
    max: 12,
    required: [true, 'A birthday must have a month']
  },
  day: {
    type: Number,
    min: 1,
    max: 31,
    required: [true, 'A birthday must have a day']
  },
  phoneNumber: String,
  email: String,
  created_at: {
    type: Date,
    default: Date.now()
  }
})

birthdaySchema.pre('save', function (next) {
  this.name = names.titleCaseNames(this.name)
  next()
})

module.exports = mongoose.model('birthday', birthdaySchema)
