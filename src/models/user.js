const mongoose = require('mongoose')

const namesUtils = require('../utils/names')
const authUtils = require('../utils/auth')
const { SCHEMA_OPTIONS } = require('../constants')

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'A user must have a name']
    },
    email: {
      type: String,
      lowercase: true,
      validate: [authUtils.validateEmail, 'invalid email address'],
      unique: true,
      required: [true, 'A user must have an email address']
    },
    phone: {
      type: String,
      validate: [authUtils.validatePhoneNumber, 'Invalid phone number format'],
      lowercase: true,
      unique: true
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

module.exports = mongoose.model('User', userSchema)
