const { Schema, model } = require('mongoose')

const namesUtils = require('../utils/names')
const { SCHEMA_OPTIONS, USER_ROLES } = require('../settings/constants')

const userSchema = new Schema(
  {
    name: { type: String, required: [true, 'A user must have a name'] },
    email: {
      type: String,
      unique: true,
      lowercase: true,
      required: [true, 'A user must have an email address']
      // validate: [(email) => REGEX.email.test(email), 'invalid email address']
    },
    phone: {
      type: String,
      unique: true
      // validate: [(phone) => REGEX.phone.test(phone), 'Invalid phone number']
    },
    role: {
      type: String,
      enum: USER_ROLES,
      default: USER_ROLES[0] //user
    },
    accessCode: { type: String, select: false },
    accessCodeExpires: { type: Date, select: false },
    refreshToken: { type: String, select: false },
    isLoggedIn: { type: Boolean, default: false },
    isActive: { type: Boolean, default: false },
    updatedAt: { type: Date, select: false },
    created_at: { type: Date, default: Date.now() }
  },
  SCHEMA_OPTIONS
)

userSchema.pre('save', function (next) {
  if (this.isNew) {
    this.name = namesUtils.titleCaseNames(this.name)
  }
  next()
})

userSchema.pre(/^find/, function (next) {
  this.select('-__v')
  next()
})

module.exports = model('User', userSchema)
