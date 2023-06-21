const User = require('../models/user')
const Birthday = require('../models/birthday')
const catchAsync = require('../utils/catchAsync')
const { sendResponse } = require('../utils/contollers')
const { RESPONSE_TYPE, FIND_UPDATE_OPTIONS } = require('../settings/constants')

exports.getMe = catchAsync(async (req, res) => {
  sendResponse(RESPONSE_TYPE.success, res, { data: req.currentUser })
})

exports.deleteMe = catchAsync(async (req, res) => {
  req.currentUser.isActive = false
  await req.currentUser.save()
  sendResponse(RESPONSE_TYPE.success, res, { status: 204, message: '' })
})

exports.updateMe = catchAsync(async (req, res) => {
  sendResponse(RESPONSE_TYPE.success, res, {
    data: await User.findByIdAndUpdate(
      req.currentUser['_id'],
      req.body,
      FIND_UPDATE_OPTIONS
    )
  })
})

exports.addMyBirthday = catchAsync(async (req, res) => {
  const newBirthday = {
    ...req.body,
    owner: req.currentUser['_id']
  }

  sendResponse(RESPONSE_TYPE.success, res, {
    status: 201,
    data: await Birthday.create(newBirthday)
  })
})

exports.getMyBirthdays = catchAsync(async (req, res, next) => {
  const birthdays = await Birthday.find({ owner: req.currentUser['_id'] })
    .select('name month day phone email')
    .exec()

  if (!birthdays.length) {
    return next(
      new AppError(
        ` There is no birthday associated with ${req.currentUser.name}`,
        HTTP_STATUS_CODES.error.notFound
      )
    )
  }

  sendResponse(RESPONSE_TYPE.success, res, {
    data: birthdays
  })
})
