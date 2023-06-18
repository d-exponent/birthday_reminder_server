const mongoose = require('mongoose');
const namesUtils = require('../utils/names');
const authUtils = require('../utils/auth');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'A user must have a name'],
  },
  email: {
    type: String,
    lowercase: true,
    validate: [authUtils.validateEmail, 'invalid email address'],
    unique: true,
    required: [true, 'A user must have an email address'],
  },
  phone: {
    type: String,
    validate: [authUtils.validatePhoneNumber, 'Invalid phone number format'],
    lowercase: true,
    unique: true,
  },
  accessCode: {
    type: String,
    select: false,
  },
  accessCodeExpires: Date,
  refreshToken:{
    type: String,
    select: false
  },
  verfied: {
    type: Boolean,
    default: false,
  },
  created_at: {
    type: Date,
    default: Date.now(),
  },
});

userSchema.methods.validateAccessCode = function (accessCode) {
  const isValidAccessCode = this.accessCode === accessCode;
  if (!isValidAccessCode) return false;

  console.log(Date.now(), new Date(this.accessCodeExpires).getTime());
  if (Date.now() > new Date(this.accessCodeExpires).getTime()) {
    return false;
  }

  return true;
};

userSchema.pre('save', function (next) {
  this.name = namesUtils.titleCaseNames(this.name);
  next();
});

const user = mongoose.model('User', userSchema);
module.exports = user;
