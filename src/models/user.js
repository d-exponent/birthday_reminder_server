const { Schema, model } = require('mongoose')
const { REGEX } = require('../constants')

const namesUtils = require('../utils/names')
const { SCHEMA_OPTIONS } = require('../constants')

const userSchema = new Schema(
  {
    name: {
      type: String,
      required: [true, 'A user must have a name']
    },
    email: {
      type: String,
      unique: true,
      lowercase: true,
      required: [true, 'A user must have an email address'],
      // validate: [(email) => REGEX.email.test(email), 'invalid email address']
    },
    phone: {
      type: String,
      unique: true,
      lowercase: true,
      validate: [(phone) => REGEX.phone.test(phone), 'Invalid phone number']
    },
    accessCode: {
      type: String,
      select: false
    },
    accessCodeExpires: {
      type: Date,
      select: false
    },
    refreshToken: {
      type: String,
      select: false
    },
    verfied: {
      type: Boolean,
      default: false
    },
    created_at: {
      type: Date,
      default: Date.now()
    }
  },
  SCHEMA_OPTIONS
)

userSchema.pre('save', function (next) {
  this.name = namesUtils.titleCaseNames(this.name)
  next()
})

userSchema.pre(/^find/, function (next) {
  this.select('-__v')
  next()
})

module.exports = model('User', userSchema)
