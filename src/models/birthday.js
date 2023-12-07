/* eslint-disable func-names */
const { Schema, model } = require('mongoose')
const { titleCaseNames } = require('./common')


const birthdaySchema = new Schema({
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
  email: String,
  phone: String,
  owner: { type: Schema.Types.ObjectId, ref: 'User' },
  imageCover: String,
  comments: String,
  created_at: { type: Date, default: Date.now() }
})

// birthdaySchema.virtual('imageUri').get(function (){

//   return this
// })

birthdaySchema.pre('save', function (next) {
  this.name = titleCaseNames(this.name)
  next()
})

birthdaySchema.pre(/^find/, function (next) {
  this.select('-__v')
  next()
})

module.exports = model('birthday', birthdaySchema)
