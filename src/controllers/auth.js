const jwt = require('jsonwebtoken')
const { promisify } = require('util')

const env = require('../settings/env')
const User = require('../models/user')
const Email = require('../features/email')
const AppError = require('../utils/appError')
const catchAsync = require('../utils/catchAsync')
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

let ERROR_MSG
const UNAUTHORIZED_STATUS = HTTP_STATUS_CODES.error.unauthorized
const NOT_FOUND_STATUS = HTTP_STATUS_CODES.error.notFound

exports.requestAccessCode = catchAsync(async (req, res, next) => {
  const user = await User.findOne(req.identifierQuery)
    .select(baseSelect('isActive'))
    .exec()

  ERROR_MSG = 'The user does not exist'
  if (!user || !user.isActive) return next(new AppError(ERROR_MSG, NOT_FOUND_STATUS))

  user.accessCode = generateAccessCode()
  user.accessCodeExpires = getTimeIn((minutes = 10))
  await user.save()

  const { name, email, accessCode } = user
  env.isProduction && (await new Email(name, email).sendAccessCode(accessCode))

  sendResponse(RESPONSE_TYPE.success, res, {
    message: `An access code has been sent to ${user.email}. Expires in ten (10) minutes`
  })
})

exports.login = catchAsync(async (req, res, next) => {
  const user = await User.findOne(req.identifierQuery)
    .select(baseSelect('accessCodeExpires'))
    .exec()

  if (!user) {
    ERROR_MSG = 'Invalid access code'
    return next(new AppError(ERROR_MSG, UNAUTHORIZED_STATUS))
  }

  if (Date.now() > user.accessCodeExpires.getTime()) {
    ERROR_MSG = 'Invalid access code'
    return next(new AppError(ERROR_MSG, UNAUTHORIZED_STATUS))
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
    ERROR_MSG = 'Invalid Token'
    return next(new AppError(ERROR_MSG, UNAUTHORIZED_STATUS))
  }

  const email = req.email.toLowerCase()
  const user = await User.findOne({ email }).select(baseSelect('refreshToken')).exec()

  ERROR_MSG = 'Invalid auth credentials'
  if (!user) return next(new AppError(ERROR_MSG, UNAUTHORIZED_STATUS))

  if (user.refreshToken !== refreshToken) {
    return next(new AppError(ERROR_MSG, UNAUTHORIZED_STATUS))
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

  ERROR_MSG = 'Provide loging credentials'
  const provideCredentialsError = new AppError(ERROR_MSG, UNAUTHORIZED_STATUS)
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

  ERROR_MSG = 'Login credentials is not associated with any user'
  if (!user) return next(new AppError(ERROR_MSG, NOT_FOUND_STATUS))

  ERROR_MSG = 'This user no longer exists in our records'
  if (!user.isActive) return next(new AppError(ERROR_MSG, NOT_FOUND_STATUS))

  ERROR_MSG = 'You are not logged in. Please Login'
  if (!user.isLoggedIn) return next(new AppError(ERROR_MSG, UNAUTHORIZED_STATUS))

  req.currentUser = user
  next()
})

exports.restrictTo = (...args) => {
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
      ERROR_MSG = 'You do not have permission to access this resource'
      return next(new AppError(ERROR_MSG, HTTP_STATUS_CODES.error.forbidden))
    }

    next()
  }
}
