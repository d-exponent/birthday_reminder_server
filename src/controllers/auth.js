const jwt = require('jsonwebtoken')
const { promisify } = require('util')

const env = require('../settings/env')
const User = require('../models/user')
const Email = require('../features/email')
const AppError = require('../utils/appError')
const catchAsync = require('../utils/catchAsync')
const { sendResponse, baseSelect } = require('../utils/contollers')
const {
  HTTP_STATUS_CODES,
  RESPONSE_TYPE,
  REGEX,
  USER_ROLES
} = require('../settings/constants')
const {
  generateAccessCode,
  getTimeIn,
  signRefreshToken,
  accessTokenCookieManager
} = require('../utils/auth')

const UNAUTHORIZED_STATUS = HTTP_STATUS_CODES.error.unauthorized
const NOT_FOUND_STATUS = HTTP_STATUS_CODES.error.notFound
let ERROR

exports.requestAccessCode = catchAsync(async (req, res, next) => {
  const user = await User.findOne(req.identifierQuery).exec()

  if (!user) {
    ERROR = new AppError('The user was not found', NOT_FOUND_STATUS)
    return next(ERROR)
  }

  user.accessCode = generateAccessCode()
  user.accessCodeExpires = getTimeIn((minutes = 10))
  user.verfied = false
  await user.save()

  const { name, email, accessCode } = user
  const message = `An access code has been sent to ${user.email}. Expires in ten (10) minutes`

  await new Email(name, email).sendAccessCode(accessCode)
  sendResponse(RESPONSE_TYPE.success, res, { message })
})

exports.login = catchAsync(async (req, res, next) => {
  const user = await User.findOne(req.identifierQuery).select(
    baseSelect('accessCodeExpires')
  ).exec()

  if (!user) {
    ERROR = new AppError('Invalid access code', UNAUTHORIZED_STATUS)
    return next(ERROR)
  }

  if (Date.now() > user.accessCodeExpires.getTime()) {
    return next(new AppError('Expired credentails', UNAUTHORIZED_STATUS))
  }

  const accessToken = accessTokenCookieManager(req, res, user.email)
  const refreshToken = signRefreshToken(user.email)

  user.accessCode = undefined
  user.accessCodeExpires = undefined
  user.verfied = true
  user.refreshToken = refreshToken

  await user.save()
  sendResponse(RESPONSE_TYPE.success, res, {
    data: {
      ...JSON.parse(JSON.stringify(user)),
      refreshToken: undefined,
      verfied: undefined
    },
    accessToken,
    refreshToken
  })
})

exports.logout = catchAsync(async (req, res) => {
  const user = await User.findOne({ email: req.currentUser.email })
  user.refreshToken = undefined
  user.verfied = undefined
  await user.save()

  accessTokenCookieManager(req, res, '', true)
  sendResponse(RESPONSE_TYPE.success, res, { status: 204, message: 'logged out' })
})

exports.getTokens = catchAsync(async (req, res, next) => {
  const refreshToken = req.headers['x-auth-refresh']
  if (!refreshToken) {
    return next(new AppError('Invalid token', UNAUTHORIZED_STATUS))
  }

  const email = req.email.toLowerCase()
  const user = await User.findOne({ email }).select(baseSelect('refreshToken')).exec()

  const invalidAuthCredentialsMsg = 'Invalid auth credentials'

  if (!user) {
    return next(new AppError(invalidAuthCredentialsMsg, UNAUTHORIZED_STATUS))
  }

  if (user.refreshToken !== refreshToken) {
    return next(new AppError(invalidAuthCredentialsMsg, UNAUTHORIZED_STATUS))
  }

  try {
    await promisify(jwt.verify)(refreshToken, env.refreshTokenSecret)
  } catch (e) {
    user.refreshToken = undefined
    user.save().catch((e) => console.error('🛑GET TOKENS CONTROLLER', e.message))
    return next(e)
  }

  user.refreshToken = signRefreshToken(user.email)
  await user.save()

  sendResponse(RESPONSE_TYPE.success, res, {
    refreshToken: user.refreshToken,
    accessToken: accessTokenCookieManager(req, res, email),
    status: HTTP_STATUS_CODES.success.created
  })
})

exports.protect = catchAsync(async (req, _, next) => {
  const cookieToken = req.signedCookies[env.cookieName] || null
  const headerAuthorization = req.headers['authorization'] || null

  if (!cookieToken && !headerAuthorization) {
    return next(
      new AppError(
        'Please Login with valid credentials',
        HTTP_STATUS_CODES.error.unauthorized
      )
    )
  }

  const token =
    cookieToken && REGEX.jwtToken.test(cookieToken)
      ? cookieToken
      : headerAuthorization &&
        REGEX.bearerJwtToken.test(headerAuthorization) &&
        REGEX.jwtToken.test(headerAuthorization.split(' ')[1])
      ? headerAuthorization.split(' ')[1]
      : null

  const invalidCredentialsError = new AppError(
    'Invalid login credentials. Please login',
    HTTP_STATUS_CODES.error.unauthorized
  )

  if (token === null) return next(invalidCredentialsError)

  const decoded = await promisify(jwt.verify)(token, env.accessTokenSecret)
  const user = await User.findOne({ email: decoded.email }).exec()
  if (!user) return next(invalidCredentialsError)

  req.currentUser = user
  next()
})

exports.restrictTo = (...args) => {
  // Ensure at least one role is passed
  if (!args.length) throw new Error('restrictTo requires at least one valid role')

  // ENSURE ONLY VALID ROLES ARE PASSED AS ARGUMENTS
  args.forEach((arg) => {
    if (!USER_ROLES.includes(arg)) {
      throw new Error(`${arg} is not a valid role`)
    }
  })

  return (req, _, next) => {
    if (!args.includes(req.currentUser.role)) {
      return next(
        new AppError(
          'You do not have permission to access this resource',
          HTTP_STATUS_CODES.error.forbidden
        )
      )
    }

    next()
  }
}
