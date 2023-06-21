const User = require('../models/user')
const Email = require('../features/email')
const AppError = require('../utils/appError')
const catchAsync = require('../utils/catchAsync')
const { sendResponse } = require('../utils/contollers')
const {
  HTTP_STATUS_CODES,
  RESPONSE_TYPE,
  FIND_UPDATE_OPTIONS
} = require('../settings/constants')
const {
  generateAccessCode,
  getTimeIn,
  signRefreshToken,
  accessTokenCookieManager
} = require('../utils/auth')

const NOT_FOUND_ERR = new AppError('Not found', HTTP_STATUS_CODES.error.notFound)

exports.createUser = catchAsync(async (req, res) => {
  const userData = {
    ...req.body,
    accessCode: generateAccessCode(),
    accessCodeExpires: getTimeIn((minutes = 10)),
    refreshToken: signRefreshToken(req.body.email.toLowerCase()),
    verified: undefined
  }

  // ALLOW ADMIN TO CREATE USERS WITH DIFFERENT ROLES
  userData.role =
    req.currentUser && req.currentUser.role === 'admin' && req.body.role
      ? req.body.role
      : undefined

  const user = await User.create(userData)
  sendResponse(RESPONSE_TYPE.success, res, {
    data: {
      ...JSON.parse(JSON.stringify(user)),
      __v: undefined,
      accessCode: undefined,
      accessCodeExpires: undefined,
      refreshToken: undefined
    },
    status: HTTP_STATUS_CODES.success.created,
    accessToken: accessTokenCookieManager(req, res, user.email),
    refreshToken: user.refreshToken,
    message: `Check ${user.email} for the one time password to verify your profile`
  })

  user
    .save()
    .then(() => new Email(user.name, user.email).sendAccessCode(user.accessCode))
    .catch((e) => console.error('🛑🛑 ERROR', e))
})

exports.getUsers = catchAsync(async (_, res, next) => {
  const user = await User.find().exec()
  if (!user) return next(NOT_FOUND_ERR)
  sendResponse(RESPONSE_TYPE.success, res, { data: await User.find() })
})

exports.getUser = catchAsync(async ({ identifierQuery }, res, next) => {
  const user = await User.findOne(identifierQuery).exec()
  if (!user) return next(NOT_FOUND_ERR)

  sendResponse(RESPONSE_TYPE.success, res, { data: user })
})

exports.updateUser = catchAsync(async (req, res, next) => {
  const user = await User.findOneAndUpdate(
    req.identifierQuery,
    req.body,
    FIND_UPDATE_OPTIONS
  ).exec()

  if (!user) return next(NOT_FOUND_ERR)
  sendResponse(RESPONSE_TYPE.success, res, { data: user })
})

exports.deleteUser = catchAsync(async ({ identifierQuery }, res, next) => {
  const user = await User.findOne(identifierQuery)
  if (!user) return next(NOT_FOUND_ERR)

  await User.findOneAndDelete(identifierQuery)
  sendResponse(RESPONSE_TYPE.success, res, { status: 204 })
})
