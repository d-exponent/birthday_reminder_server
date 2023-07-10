const { Schema, model } = require('mongoose')
const { SCHEMA_OPTIONS, USER_ROLES, REGEX } = require('../settings/constants')
const { titleCaseNames } = require('./common')

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
      validate: [
        email => REGEX.email.test(email),
        '{VALUE} is not of valid email'
      ]
    },
    phone: {
      type: String,
      unique: true,
      validate: [
        phone => REGEX.phone.test(phone),
        '{VALUE} is not formatted properly. example +234#########'
      ]
    },
    role: {
      type: String,
      default: USER_ROLES[0], //user
      enum: {
        values: USER_ROLES,
        message: `{VALUE} is not a valid role`
      }
    },
    accessCode: { type: String, select: false },
    accessCodeExpires: { type: Date, select: false },
    refreshToken: { type: String, select: false },
    isActive: { type: Boolean, default: true, select: false },
    isVerified: { type: Boolean, default: false, select: false },
    updatedAt: { type: Date, select: false },
    created_at: { type: Date, default: Date.now(), select: false }
  },
  SCHEMA_OPTIONS
)

userSchema.pre('save', function (next) {
  this.name = titleCaseNames(this.name)
  next()
})

userSchema.pre('update', function (next) {
  this.updatedAt = new Date()
  next()
})

userSchema.pre(/^find/, function (next) {
  this.select('-__v')
  next()
})

module.exports = model('User', userSchema)
