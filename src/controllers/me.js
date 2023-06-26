const User = require('../models/user')
const AppError = require('../utils/app-error')
const Birthday = require('../models/birthday')
const catchAsync = require('../utils/catch-async')
const queryBuilder = require('../utils/query-builder')

const { sendResponse, removeFalsyIsLoggedInIsActive } = require('../utils/contollers')
const {
  RESPONSE_TYPE,
  FIND_UPDATE_OPTIONS,
  HTTP_STATUS_CODES
} = require('../settings/constants')

let error_msg
exports.getMe = catchAsync(async (req, res) => {
  sendResponse(RESPONSE_TYPE.success, res, {
    data: { ...removeFalsyIsLoggedInIsActive(req.currentUser), role: undefined }
  })
})

exports.deleteMe = catchAsync(async (req, res) => {
  req.currentUser.isActive = false
  await req.currentUser.save()

  sendResponse(RESPONSE_TYPE.success, res, {
    status: HTTP_STATUS_CODES.success.noContent,
    message: ''
  })
})

exports.updateMe = catchAsync(async (req, res) => {
  const user = await User.findByIdAndUpdate(
    req.currentUser['_id'],
    req.body,
    FIND_UPDATE_OPTIONS
  )
  sendResponse(RESPONSE_TYPE.success, res, {
    data: { ...removeFalsyIsLoggedInIsActive(user), role: undefined }
  })
})

exports.addBirthday = catchAsync(async (req, res) => {
  sendResponse(RESPONSE_TYPE.success, res, {
    status: 201,
    data: await Birthday.create({
      ...req.body,
      owner: req.currentUser['_id']
    })
  })
})

exports.getMyBirthdays = catchAsync(async (req, res, next) => {
  const query = new queryBuilder(
    Birthday.find({ owner: req.currentUser['_id'] }).select('-owner'),
    req.query
  )
    .fields()
    .page()
    .sort()

  const birthdays = await query.mongooseQuery.exec()

  if (!birthdays.length) {
    error_msg = ` There is no birthday associated with ${req.currentUser.name}`
    return next(new AppError(error_msg, HTTP_STATUS_CODES.error.notFound))
  }

  sendResponse(RESPONSE_TYPE.success, res, { data: birthdays })
})
