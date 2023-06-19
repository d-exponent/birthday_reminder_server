const User = require('../models/user')
const Email = require('../features/email')
const AppError = require('../utils/appError')
const catchAsync = require('../utils/catchAsync')
const { HTTP_STATUS_CODES, RESPONSE_TYPE } = require('../constants')
const {
  generateAccessCode,
  getTimeIn,
  signRefreshToken,
  accessTokenCookieManager
} = require('../utils/auth')
const { sendResponse } = require('../utils/contollers')

let DB_USER
const NOT_FOUND_ERR = new AppError('Not found', HTTP_STATUS_CODES.error.notFound)

exports.createUser = catchAsync(async (req, res) => {
  const {
    body: { email }
  } = req
  const userData = {
    ...req.body,
    accessCode: generateAccessCode(),
    accessCodeExpires: getTimeIn((minutes = 10)),
    refreshToken: signRefreshToken(email),
    verified: undefined
  }

  DB_USER = await User.create(userData)

  sendResponse(RESPONSE_TYPE.success, res, {
    data: {
      ...JSON.parse(JSON.stringify(DB_USER)),
      __v: undefined,
      accessCode: undefined,
      accessCodeExpires: undefined,
      refreshToken: undefined
    },
    status: HTTP_STATUS_CODES.success.created,
    accessToken: accessTokenCookieManager(res, email),
    refreshToken: DB_USER.refreshToken,
    message: `Check ${DB_USER.email} for the one time password to verify your profile`
  })

  const emailer = new Email(DB_USER.name, DB_USER.email)

  DB_USER.save()
    .then(() => emailer.sendAccessCode(DB_USER.accessCode))
    .catch((e) => console.error('🛑🛑 ERROR', e))
})

exports.getUsers = catchAsync(async (_, res, next) => {
  DB_USER = await User.find()
  if (!DB_USER) return next(NOT_FOUND_ERR)
  sendResponse(RESPONSE_TYPE.success, res, { data: await User.find() })
})

exports.getUser = catchAsync(async ({ identifierQuery }, res, next) => {
  DB_USER = await User.findOne(identifierQuery)
  if (!DB_USER) return next(NOT_FOUND_ERR)

  sendResponse(RESPONSE_TYPE.success, res, { data: DB_USER })
})

exports.updateUser = catchAsync(async (req, res, next) => {
  DB_USER = await User.findOneAndUpdate(req.identifierQuery, req.body, {
    new: true,
    runValidators: true
  })

  if (!DB_USER) return next(NOT_FOUND_ERR)
  sendResponse(RESPONSE_TYPE.success, res, { data: DB_USER })
})

exports.deleteUser = catchAsync(async ({ identifierQuery }, res, next) => {
  DB_USER = await User.findOne(identifierQuery)
  if (!DB_USER) return next(NOT_FOUND_ERR)

  await User.findOneAndDelete(identifierQuery)
  sendResponse(RESPONSE_TYPE.success, res, { status: 204 })
})
