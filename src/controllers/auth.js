const jwt = require('jsonwebtoken')
const { promisify } = require('util')

const env = require('../settings/env')
const User = require('../models/user')
const Email = require('../features/email')
const AppError = require('../utils/app-error')
const catchAsync = require('../utils/catch-async')
const {
  HTTP_STATUS_CODES,
  RESPONSE_TYPE,
  REGEX,
  USER_ROLES
} = require('../settings/constants')
const {
  sendResponse,
  baseSelect,
  removeFalsyIsLoggedInIsActive
} = require('../utils/contollers')
const {
  generateAccessCode,
  getTimeIn,
  signRefreshToken,
  accessTokenCookieManager
} = require('../utils/auth')

let error_msg
const UNAUTHORIZED_STATUS = HTTP_STATUS_CODES.error.unauthorized
const NOT_FOUND_STATUS = HTTP_STATUS_CODES.error.notFound

exports.requestAccessCode = catchAsync(async (req, res, next) => {
  const user = await User.findOne(req.customQuery).select(baseSelect('isActive')).exec()

  error_msg = 'The user does not exist'
  if (!user || !user.isActive) return next(new AppError(error_msg, NOT_FOUND_STATUS))

  user.accessCode = generateAccessCode()
  user.accessCodeExpires = getTimeIn((minutes = 10))
  await user.save()

  await new Email(user.name, user.email).sendAccessCode(user.accessCode)

  sendResponse(RESPONSE_TYPE.success, res, {
    message: `An access code has been sent to ${user.email}. Expires in ten (10) minutes`
  })
})

exports.login = catchAsync(async (req, res, next) => {
  const user = await User.findOne({ accessCode: req.params.accessCode })
    .select(baseSelect('accessCodeExpires'))
    .exec()

  const error = new AppError('Invalid access code', UNAUTHORIZED_STATUS)
  if (!user) return next(error)

  if (Date.now() > user.accessCodeExpires.getTime()) {
    return next(error)
  }

  user.accessCode = undefined
  user.accessCodeExpires = undefined
  user.isLoggedIn = true
  user.isActive = true
  user.refreshToken = signRefreshToken(user.email)
  await user.save()

  sendResponse(RESPONSE_TYPE.success, res, {
    accessToken: accessTokenCookieManager(req, res, user.email),
    refreshToken: user.refreshToken,
    data: {
      ...removeFalsyIsLoggedInIsActive(user),
      refreshToken: undefined
    }
  })
})

exports.setUserForlogout = async (req, res, next) => {
  req.currentUser.isLoggedIn = false
  req.currentUser.refreshToken = undefined
  req.currentUser.accessCode = undefined
  req.currentUser.accessCodeExpires = undefined

  accessTokenCookieManager(req, res, '', true)
  next()
}

exports.logout = catchAsync(async (req, res) => {
  await req.currentUser.save()
  sendResponse(RESPONSE_TYPE.success, res, {
    status: HTTP_STATUS_CODES.success.noContent,
    message: ''
  })
})

exports.getTokens = catchAsync(async (req, res, next) => {
  const refreshToken = req.headers['x-auth-refresh']
  if (!refreshToken) {
    return next(new AppError("Provide the user's refresh token", UNAUTHORIZED_STATUS))
  }

  if (!REGEX.jwtToken.test(refreshToken)) {
    return next(new AppError('Invalid token', UNAUTHORIZED_STATUS))
  }

  const user = await User.findOne({ refreshToken })
    .select(baseSelect('refreshToken'))
    .exec()

  const invalidAuthErr = new AppError('Invalid auth credentials', UNAUTHORIZED_STATUS)
  if (!user) return next(invalidAuthErr)
  if (user.refreshToken !== refreshToken) return next(invalidAuthErr)

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
    accessToken: accessTokenCookieManager(req, res, user.email),
    status: HTTP_STATUS_CODES.success.created
  })
})

exports.protect = catchAsync(async (req, _, next) => {
  const cookieToken = req.signedCookies[env.cookieName] || null
  const headerAuthorization = req.headers['authorization'] || null

  error_msg = 'Provide loging credentials'
  const provideCredentialsError = new AppError(error_msg, UNAUTHORIZED_STATUS)
  if (!cookieToken && !headerAuthorization) return next(provideCredentialsError)

  const token =
    cookieToken && REGEX.jwtToken.test(cookieToken)
      ? cookieToken
      : headerAuthorization &&
        REGEX.bearerJwtToken.test(headerAuthorization) &&
        REGEX.jwtToken.test(headerAuthorization.split(' ')[1])
      ? headerAuthorization.split(' ')[1]
      : null

  if (token === null) return next(provideCredentialsError)

  const decoded = await promisify(jwt.verify)(token, env.accessTokenSecret)
  const user = await User.findOne({ email: decoded.email })
    .select(baseSelect('isActive', 'role', 'isLoggedIn'))
    .exec()

  const invalidCredError = new AppError('Invalid log-in credentials', UNAUTHORIZED_STATUS)

  if (!user || !user.isActive) return next(invalidCredError)

  error_msg = 'You are not logged in. Please Login'
  if (!user.isLoggedIn) return next(new AppError(error_msg, UNAUTHORIZED_STATUS))

  req.currentUser = user
  next()
})

exports.permit = (...args) => {
  // Ensure at least one role is passed
  if (!args.length) throw new Error('restrictTo requires at least one valid role')

  // Ensure only valid roles parameters are passed
  args.forEach((arg) => {
    if (!USER_ROLES.includes(arg)) {
      throw new Error(`${arg} is not a valid role`)
    }
  })

  return (req, _, next) => {
    if (!args.includes(req.currentUser.role)) {
      error_msg = 'You do not have permission to access this resource'
      return next(new AppError(error_msg, HTTP_STATUS_CODES.error.forbidden))
    }

    next()
  }
}
