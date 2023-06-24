const User = require('../models/user')
const AppError = require('../utils/appError')
const catchAsync = require('../utils/catchAsync')
const { sendResponse, removeFalsyIsLoggedInIsActive } = require('../utils/contollers')
const {
  HTTP_STATUS_CODES,
  RESPONSE_TYPE,
  FIND_UPDATE_OPTIONS
} = require('../settings/constants')

const NOT_FOUND_ERR = new AppError('Not found', HTTP_STATUS_CODES.error.notFound)

exports.createUser = catchAsync(async (req, res) => {
  const userData = {
    ...req.body,
    accessCode: undefined,
    accessCodeExpires: undefined,
    refreshToken: undefined,
    isLoggedIn: undefined,
    isActive: undefined,
    // Allow admin create users with roles
    role:
      req.currentUser && req.currentUser.role === 'admin' && req.body.role
        ? req.body.role
        : undefined
  }

  const user = await User.create(userData)

  sendResponse(RESPONSE_TYPE.success, res, {
    data: {
      ...removeFalsyIsLoggedInIsActive(user),
      __v: undefined
    },
    status: HTTP_STATUS_CODES.success.created,
    message: `${user.name} was created successfully`
  })
})

exports.getUsers = catchAsync(async (_, res, next) => {
  const user = await User.find().exec()
  if (!user) return next(NOT_FOUND_ERR)
  sendResponse(RESPONSE_TYPE.success, res, { data: await User.find() })
})

exports.getUser = catchAsync(async ({ identifierQuery }, res, next) => {
  const user = await User.findOne(identifierQuery).exec()
  if (!user) return next(NOT_FOUND_ERR)

  sendResponse(RESPONSE_TYPE.success, res, { data: removeFalsyIsLoggedInIsActive(user) })
})

exports.updateUser = catchAsync(async (req, res, next) => {
  const user = await User.findOneAndUpdate(
    req.identifierQuery,
    req.body,
    FIND_UPDATE_OPTIONS
  ).exec()

  if (!user) return next(NOT_FOUND_ERR)
  sendResponse(RESPONSE_TYPE.success, res, { data: removeFalsyIsLoggedInIsActive(user) })
})

exports.deleteUser = catchAsync(async ({ identifierQuery }, res, next) => {
  const user = await User.findOne(identifierQuery)
  if (!user) return next(NOT_FOUND_ERR)

  await User.findOneAndDelete(identifierQuery)
  sendResponse(RESPONSE_TYPE.success, res, {
    status: HTTP_STATUS_CODES.success.noContent
  })
})
