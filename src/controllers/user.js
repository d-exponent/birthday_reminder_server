const User = require('../models/user')
const Email = require('../features/email')
const AppError = require('../utils/appError')
const catchAsync = require('../utils/catchAsync')
const { HTTP_STATUS_CODES, RESPONSE_TYPE } = require('../settings/constants')
const {
  generateAccessCode,
  getTimeIn,
  signRefreshToken,
  accessTokenCookieManager
} = require('../utils/auth')
const { sendResponse } = require('../utils/contollers')

const NOT_FOUND_ERR = new AppError('Not found', HTTP_STATUS_CODES.error.notFound)

exports.createUser = catchAsync(async (req, res) => {
  const {
    body: { email }
  } = req
  const userData = {
    ...req.body,
    accessCode: generateAccessCode(),
    accessCodeExpires: getTimeIn((minutes = 10)),
    refreshToken: signRefreshToken(email, true),
    verified: undefined,
    role: undefined
  }

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
    accessToken: accessTokenCookieManager(req, res, email),
    refreshToken: user.refreshToken,
    message: `Check ${user.email} for the one time password to verify your profile`
  })

  const emailer = new Email(user.name, user.email)

  user
    .save()
    .then(() => emailer.sendAccessCode(user.accessCode))
    .catch((e) => console.error('🛑🛑 ERROR', e))
})

exports.getUsers = catchAsync(async (_, res, next) => {
  const user = await User.find()
  if (!user) return next(NOT_FOUND_ERR)
  sendResponse(RESPONSE_TYPE.success, res, { data: await User.find() })
})

exports.getUser = catchAsync(async ({ identifierQuery }, res, next) => {
  const user = await User.findOne(identifierQuery)
  if (!user) return next(NOT_FOUND_ERR)

  sendResponse(RESPONSE_TYPE.success, res, { data: user })
})

exports.updateUser = catchAsync(async (req, res, next) => {
  const user = await User.findOneAndUpdate(req.identifierQuery, req.body, {
    new: true,
    runValidators: true
  })

  if (!user) return next(NOT_FOUND_ERR)
  sendResponse(RESPONSE_TYPE.success, res, { data: user })
})

exports.deleteUser = catchAsync(async ({ identifierQuery }, res, next) => {
  const user = await User.findOne(identifierQuery)
  if (!user) return next(NOT_FOUND_ERR)

  await User.findOneAndDelete(identifierQuery)
  sendResponse(RESPONSE_TYPE.success, res, { status: 204 })
})
