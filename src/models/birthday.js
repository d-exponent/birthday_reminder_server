const mongoose = require('mongoose')
const names = require('../utils/names')

const birthdaySchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, "The birthday's owner must have a name "]
  },
  month: {
    type: Number,
    min: 1,
    max: 12,
    index: true,
    required: [true, 'A birthday must have a month']
  },
  day: {
    type: Number,
    min: 1,
    max: 31,
    index: true,
    required: [true, 'A birthday must have a day']
  },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
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

birthdaySchema.pre(/^find/, function (next) {
  this.select('-__v')
  this.populate({ path: 'owner', select: 'name email' })
  next()
})

module.exports = mongoose.model('birthday', birthdaySchema)
