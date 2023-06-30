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
  TOKENS,
  USER_ROLES
} = require('../settings/constants')

const { sendResponse, baseSelect, includeOnly } = require('../utils/contollers')

const {
  generateAccessCode,
  getTimeIn,
  signToken,
  refreshTokenCookieManager
} = require('../utils/auth')

let error_msg
let selected

const UNAUTHORIZED = HTTP_STATUS_CODES.error.unauthorized
const INVALID_TOKEN_ERROR = new AppError('Invalid auth credentials', UNAUTHORIZED)
const LOGIN_ERROR = new AppError('Please log in', UNAUTHORIZED)

exports.requestAccessCode = catchAsync(async (req, res, next) => {
  const user = await User.findOne(req.customQuery).select(baseSelect('isActive')).exec()
  error_msg = 'The user does not exist'

  if (!user || !user.isActive)
    return next(new AppError(error_msg, HTTP_STATUS_CODES.error.notFound))

  user.accessCode = generateAccessCode()
  user.accessCodeExpires = getTimeIn((minutes = 10))

  await user.save()
  await new Email(user.name, user.email).sendAccessCode(user.accessCode)

  sendResponse(RESPONSE_TYPE.success, res, {
    message: `An access code has been sent to ${user.email}. Expires in ten (10) minutes`
  })
})

exports.login = catchAsync(async (req, res, next) => {
  const [accessCode, selected] = [req.params.accessCode, baseSelect('accessCodeExpires')]

  const user = await User.findOne({ accessCode }).select(selected).exec()

  if (!user || Date.now() > user.accessCodeExpires.getTime()) {
    return next(new AppError('Invalid access code', UNAUTHORIZED))
  }

  user.accessCode = undefined
  user.accessCodeExpires = undefined
  user.isLoggedIn = true
  user.isActive = true
  user.refreshToken = refreshTokenCookieManager(req, res, user.email)
  await user.save()

  sendResponse(RESPONSE_TYPE.success, res, {
    accessToken: signToken(user.email, TOKENS.access),
    data: includeOnly(user, 'name', 'email', 'id', 'phone')
  })
})

exports.setUserForlogout = async (req, res, next) => {
  req.currentUser.isLoggedIn = false
  req.currentUser.refreshToken = undefined
  req.currentUser.accessCode = undefined
  req.currentUser.accessCodeExpires = undefined

  refreshTokenCookieManager(req, res, '', true)
  next()
}

exports.logout = catchAsync(async (req, res) => {
  await req.currentUser.save()
  sendResponse(RESPONSE_TYPE.success, res, {
    status: HTTP_STATUS_CODES.success.noContent,
    message: ''
  })
})

exports.getAccessToken = catchAsync(async (req, res, next) => {
  const refreshToken = req.signedCookies[env.cookieName]
  if (!refreshToken || !REGEX.jwtToken.test(refreshToken)) {
    return next(INVALID_TOKEN_ERROR)
  }

  const user = await User.findOne({ refreshToken }).select(baseSelect('refreshToken'))
  if (!user || user.refreshToken !== refreshToken) return next(INVALID_TOKEN_ERROR)

  try {
    await promisify(jwt.verify)(refreshToken, env.refreshTokenSecret)
  } catch (err) {
    user.refreshToken = undefined
    user.save().catch((e) => console.error('🛑GET TOKENS CONTROLLER', e.message))
    return next(err)
  }

  // REFRESH TOKEN ROTATION
  user.refreshToken = refreshTokenCookieManager(req, res, user.email)
  await user.save()

  sendResponse(RESPONSE_TYPE.success, res, {
    accessToken: signToken(user.email, TOKENS.access),
    status: HTTP_STATUS_CODES.success.created
  })
})

exports.protect = catchAsync(async (req, _, next) => {
  const headerAuthorization = req.headers['authorization'] || null

  if (!headerAuthorization) return next(LOGIN_ERROR)

  const token =
    headerAuthorization &&
    REGEX.bearerJwtToken.test(headerAuthorization) &&
    REGEX.jwtToken.test(headerAuthorization.split(' ')[1])
      ? headerAuthorization.split(' ')[1]
      : null

  if (token === null) return next(INVALID_TOKEN_ERROR)
  const decoded = await promisify(jwt.verify)(token, env.accessTokenSecret)

  selected = baseSelect('isActive', 'role', 'isLoggedIn')
  const user = await User.findOne({ email: decoded.email }).select(selected).exec()

  if (!user || !user.isActive) return next(INVALID_TOKEN_ERROR)
  if (!user.isLoggedIn) return next(LOGIN_ERROR)

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

exports.validateAccessCodeAnatomy = ({ params: { accessCode } }, _, next) => {
  if (!REGEX.accessCode.test(accessCode)) {
    error_msg = `The access code ${accessCode} on ${req.originalUrl} is wrongly formatted!`
    return next(new AppError(error_msg, HTTP_STATUS_CODES.error.badRequest))
  }
  next()
}
