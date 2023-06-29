const User = require('../models/user')
const AppError = require('../utils/app-error')
const catchAsync = require('../utils/catch-async')
const queryBuilder = require('../utils/query-builder')
const Email = require('../features/email')
const {
  generateAccessCode,
  signRefreshToken,
  getTimeIn,
  accessTokenCookieManager
} = require('../utils/auth')
const { sendResponse, removeFalsyIsLoggedInIsActive } = require('../utils/contollers')
const {
  HTTP_STATUS_CODES,
  RESPONSE_TYPE,
  FIND_UPDATE_OPTIONS,
  REGEX
} = require('../settings/constants')

const NOT_FOUND_ERR = new AppError('Not found', HTTP_STATUS_CODES.error.notFound)

exports.createUser = catchAsync(async (req, res, next) => {
  if (!REGEX.email.test(req.body?.email)) {
    return next(new AppError("Provide the valid user's email address on the request body"))
  }

  const isNewUser = !Boolean(req.currentUser)

  const user = await User.create({
    ...req.body,
    isActive: undefined,

    // Only set these for brand new user
    refreshToken: isNewUser ? signRefreshToken(req.body.email.toLowerCase()) : undefined,
    accessCode: isNewUser ? generateAccessCode() : undefined,
    accessCodeExpires: isNewUser ? getTimeIn(10) : undefined,

    // Log-in new user
    isLoggedIn: isNewUser,

    // Allow only admin create users with roles
    role:
      !isNewUser && req.currentUser.role === 'admin' && req.body.role
        ? req.body.role
        : undefined
  })

  sendResponse(RESPONSE_TYPE.success, res, {
    status: HTTP_STATUS_CODES.success.created,
    data: {
      ...removeFalsyIsLoggedInIsActive(user),
      refreshToken: undefined,
      accessToken: undefined,
      role: undefined,
      accessCode: undefined,
      accessCodeExpires: undefined,
      created_at: undefined,
      __v: undefined
    },
    refreshToken: user.refreshToken || undefined,
    accessToken: isNewUser ? accessTokenCookieManager(req, res, user.email) : undefined,
    message: `${user.name} was created successfully`
  })
})

exports.getUsers = catchAsync(async (req, res, next) => {
  const query = new queryBuilder(User.find(), req.query).fields().page().sort()
  const users = await query.mongooseQuery.exec()
  if (!users) return next(NOT_FOUND_ERR)

  sendResponse(RESPONSE_TYPE.success, res, { results: users.length, data: users })
})

exports.getUser = catchAsync(async ({ customQuery }, res, next) => {
  const user = await User.findOne(customQuery).exec()
  if (!user) return next(NOT_FOUND_ERR)

  sendResponse(RESPONSE_TYPE.success, res, { data: removeFalsyIsLoggedInIsActive(user) })
})

exports.updateUser = catchAsync(async ({ customQuery, body }, res, next) => {
  const user = await User.findOneAndUpdate(customQuery, body, FIND_UPDATE_OPTIONS)
  if (!user) return next(NOT_FOUND_ERR)

  sendResponse(RESPONSE_TYPE.success, res, { data: removeFalsyIsLoggedInIsActive(user) })
})

exports.deleteUser = catchAsync(async ({ customQuery }, res, next) => {
  const user = await User.findOne(customQuery)
  if (!user) return next(NOT_FOUND_ERR)

  await User.findOneAndDelete(customQuery)
  sendResponse(RESPONSE_TYPE.success, res, {
    status: HTTP_STATUS_CODES.success.noContent
  })
})
