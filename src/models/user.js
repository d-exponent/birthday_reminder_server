const mongoose = require('mongoose')
const { SCHEMA_OPTIONS, VALID_USER_ROLES, REGEX } = require('../settings/constants')
const { titleCaseNames } = require('./common')
const Birthday = require('./birthday')

const userSchema = new mongoose.Schema(
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
      validate: [email => REGEX.email.test(email), '{VALUE} is not of valid email']
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
      default: VALID_USER_ROLES[0], // user
      enum: {
        values: VALID_USER_ROLES,
        message: `{VALUE} is not a valid role`
      }
    },
    accessCode: { type: String, select: false, index: true },
    accessCodeExpires: { type: Date, select: false },
    refreshToken: { type: String, select: false, index: true },
    isActive: { type: Boolean, default: true, select: false },
    isVerified: { type: Boolean, default: false, select: false },
    updatedAt: { type: Date, select: false },
    created_at: { type: Date, default: Date.now(), select: false }
  },
  SCHEMA_OPTIONS
)

userSchema.pre('save', function titleNames(next) {
  this.name = titleCaseNames(this.name)
  next()
})

userSchema.pre('update', function modifyUpdateTime(next) {
  this.updatedAt = new Date()
  next()
})

userSchema.pre(/^find/, function deselectVersion(next) {
  this.select('-__v')
  next()
})

userSchema.pre('findOneAndDelete', async function saveDeletedUserIdForPostQuery(next) {
  const query = this.getQuery()
  try {
    const userToDelete = await this.model.findOne(query)
    this['_userId'] = userToDelete['_id']
  } catch (_) {
    /* empty */
  }
  next()
})

userSchema.post('findOneAndDelete', async function deleteBirthdaysForDeletedUser() {
  if (this['_userId']) {
    try {
      await Birthday.deleteMany({ owner: this['_userId'] })
    } catch (_) {
      /* empty */
    }
  }
})

module.exports = mongoose.model('User', userSchema)
