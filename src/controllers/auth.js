const jwt = require('jsonwebtoken')
const { promisify } = require('util')

const env = require('../settings/env')
const User = require('../models/user')
const Email = require('../features/email')
const AppError = require('../utils/app-error')
const catchAsync = require('../utils/catch-async')
const { STATUS, RESPONSE, REGEX, USER_ROLES } = require('../settings/constants')

const {
  sendResponse,
  baseSelect,
  defaultSelectedUserValues
} = require('../utils/contollers')

const {
  generateAccessCode,
  getTimeIn,
  signToken,
  refreshTokenCookieManager
} = require('../utils/auth')

let error_msg
let selected

const UNAUTHORIZED = STATUS.error.unauthorized
const INVALID_TOKEN_ERROR = new AppError('Invalid auth credentials', UNAUTHORIZED)
const LOGIN_ERROR = new AppError('Please log in', UNAUTHORIZED)

exports.requestAccessCode = catchAsync(async (req, res, next) => {
  const user = await User.findOne(req.customQuery).select(baseSelect('isActive'))

  error_msg = 'The user does not exist'

  if (!user || !user.isActive)
    return next(new AppError(error_msg, STATUS.error.notFound))

  user.accessCode = generateAccessCode()
  user.accessCodeExpires = getTimeIn((minutes = 10))

  await user.save()
  await new Email(user.name, user.email).sendAccessCode(user.accessCode)

  sendResponse(RESPONSE.success, res, {
    message: `An access code has been sent to ${user.email}. Expires in ten (10) minutes`
  })
})

exports.login = catchAsync(async (req, res, next) => {
  const selected = baseSelect('accessCodeExpires', 'role', 'isVerified')

  const user = await User.findOne(req.customQuery).select(selected)

  if (!user || Date.now() > user.accessCodeExpires.getTime()) {
    return next(new AppError('Invalid access code', UNAUTHORIZED))
  }

  const firstLogin = !user.isVerified

  user.accessCode = undefined
  user.accessCodeExpires = undefined
  user.isVerified = true
  user.refreshToken = refreshTokenCookieManager(res, user.email)
  await user.save()

  sendResponse(RESPONSE.success, res, {
    accessToken: signToken(user.email),
    data: defaultSelectedUserValues(user)
  })

  if (firstLogin) {
    await new Email(user.name, user.email).sendWelcome()
  }
})

exports.logout = catchAsync(async (req, res) => {
  await req.currentUser.save()
  sendResponse(RESPONSE.success, res, {
    status: STATUS.success.noContent,
    message: ''
  })
})

exports.getAccessToken = catchAsync(async (req, res, next) => {
  const cookiesLoc = env.isProduction ? 'signedCookies' : 'cookies'
  const refreshToken = req[cookiesLoc][env.cookieName]

  if (!refreshToken || !REGEX.jwtToken.test(refreshToken)) {
    return next(INVALID_TOKEN_ERROR)
  }

  const user = await User.findOne({ refreshToken }).select(
    baseSelect('refreshToken')
  )
  if (!user || user.refreshToken !== refreshToken) return next(INVALID_TOKEN_ERROR)

  await promisify(jwt.verify)(refreshToken, env.refreshTokenSecret)

  // REFRESH TOKEN ROTATION
  user.refreshToken = refreshTokenCookieManager(res, user.email)
  await user.save()

  sendResponse(RESPONSE.success, res, {
    accessToken: signToken(user.email),
    status: STATUS.success.created
  })
})

exports.protect = catchAsync(async (req, _, next) => {
  const headerAuthorization = req.headers['authorization']

  const token =
    headerAuthorization && REGEX.bearerJwtToken.test(headerAuthorization)
      ? headerAuthorization.split(' ')[1]
      : null

  if (!token) return next(INVALID_TOKEN_ERROR)

  const decoded = await promisify(jwt.verify)(token, env.accessTokenSecret)
  selected = baseSelect('isActive', 'role', 'isVerified')

  const user = await User.findOne({ email: decoded.email }).select(selected)
  if (!user || !user.isActive) return next(INVALID_TOKEN_ERROR)
  if (!user.isVerified) return next(LOGIN_ERROR)

  req.currentUser = user
  next()
})

exports.setUserForlogout = async (req, res, next) => {
  req.currentUser.refreshToken = undefined
  req.currentUser.accessCode = undefined
  req.currentUser.accessCodeExpires = undefined
  refreshTokenCookieManager(res, '', true)
  next()
}

exports.permit = (...args) => {
  // Ensure at least one role is passed
  if (!args.length) throw new Error('restrictTo requires at least one valid role')

  // Ensure only valid roles  are passed
  args.forEach(arg => {
    if (!USER_ROLES.includes(arg)) {
      throw new Error(`${arg} is not a valid role`)
    }
  })

  return (req, _, next) => {
    if (!args.includes(req.currentUser.role)) {
      error_msg = 'You do not have permission to access this resource'
      return next(new AppError(error_msg, STATUS.error.forbidden))
    }

    next()
  }
}

// -------------  HELPER MIDDLEWARE

exports.validateAccessCodeSetCustomQuery = (req, _, next) => {
  const { customQuery, params, originalUrl } = req

  if (!REGEX.accessCode.test(params.accessCode)) {
    error_msg = `The access code ${params.accessCode} on ${originalUrl} is invalid`
    return next(new AppError(error_msg, STATUS.error.badRequest))
  }

  customQuery.accessCode = params.accessCode
  next()
}
