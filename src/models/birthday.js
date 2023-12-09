const mongoose = require('mongoose')
const { titleCaseNames } = require('./common')

const birthdaySchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'The birthday must have a name ']
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
  email: {
    type: String,
    index: {
      unique: true,
      partialFilterExpression: { email: { $type: 'string' } }
    }
  },
  phone: {
    type: String,
    index: {
      unique: true,
      partialFilterExpression: { phone: { $type: 'string' } }
    }
  },
  owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  imageCover: String,
  comments: String,
  created_at: { type: Date, default: Date.now() }
})

birthdaySchema.methods.prependURLEndpointToImageCover =
  function prependURLEndpointToImageCover(domain) {
    if (this.imageCover) {
      this.imageCover = `${domain}/api/v1/users/me/birthdays/images/${this.imageCover}`
    }
  }

birthdaySchema.pre('save', function titleNames(next) {
  this.name = titleCaseNames(this.name)
  next()
})

birthdaySchema.pre(/^find/, function deselectVersion(next) {
  this.select('-__v')
  next()
})

module.exports = mongoose.model('birthday', birthdaySchema)
