const { promisify } = require('util')
const jwt = require('jsonwebtoken')

const env = require('../settings/env')
const User = require('../models/user')
const Email = require('../features/email')
const AppError = require('../lib/app-error')
const catchAsync = require('../lib/catch-async')
const commitError = require('../lib/commit-error')
const { EmailError } = require('../lib/custom-errors')
const { defaultSelectsAnd, excludeNonDefaults } = require('../lib/utils')
const { generateAccessCode, timeInMinutes, signToken } = require('../lib/auth')
const {
  STATUS,
  REGEX,
  VALID_USER_ROLES,
  DELETE_RESPONSE,
  RESPONSE_TYPE
} = require('../settings/constants')

const INVALID_TOKEN_ERROR = new AppError(
  'Invalid auth credentials',
  STATUS.error.unauthorized
)

const saveEmailErrorToDB = message => {
  commitError(new EmailError(message)).catch(e => console.error(e.message))
}

exports.requestAccessCode = catchAsync(async (req, res, next) => {
  const user = await User.findOne({ email: req.params.email }).select(
    defaultSelectsAnd('isActive')
  )

  if (!user || !user.isActive)
    return next(new AppError('The user does not exist', STATUS.error.notFound))

  user.accessCode = generateAccessCode()
  user.accessCodeExpires = timeInMinutes(10)

  const results = await Promise.allSettled([
    user.save(),
    new Email(user.name, user.email).sendAccessCode(user.accessCode)
  ])

  if (results.every(result => result.status === 'fulfilled')) {
    return res.sendResponse({
      message: `An access code has been sent to ${user.email}. Expires in ten (10) minutes`
    })
  }

  const [, sentEmail] = results
  const errorResponseType = RESPONSE_TYPE.error

  if (sentEmail.status === 'rejected') {
    res.sendResponse(
      { message: `Error sending ${user.email} the access code` },
      errorResponseType
    )
    saveEmailErrorToDB(sentEmail.reason)
  } else {
    res.sendResponse(
      { message: 'There was an error processing your request. Please try again!' },
      errorResponseType
    )
  }
})

exports.submitAccessCode = catchAsync(async (req, res, next) => {
  const user = await User.findOne({
    email: req.params.email,
    accessCode: req.params.accessCode
  }).select(defaultSelectsAnd('accessCodeExpires', 'role', 'isVerified'))

  if (!user || Date.now() > user.accessCodeExpires.getTime())
    return next(new AppError('Invalid access code', STATUS.error.unauthorized))

  const firstLogin = !user.isVerified

  user.accessCode = undefined
  user.accessCodeExpires = undefined
  user.isVerified = true
  user.refreshToken = req.refreshTokenManager(user.email)
  await user.save()

  res.sendResponse({
    accessToken: signToken(user.email),
    refreshToken: req.getTokenOnMobileRequest(user.refreshToken),
    data: excludeNonDefaults(user)
  })

  // Send welcome email on the first login of a new user
  if (firstLogin) {
    try {
      await new Email(user.name, user.email).sendWelcome()
    } catch (e) {
      saveEmailErrorToDB(e.message ?? 'Unkown Error')
    }
  }
})

exports.getAccessToken = catchAsync(async (req, res, next) => {
  let refreshToken
  if (req.isMobile) {
    refreshToken = req.query.refreshToken
  } else {
    const cookies = req.isSecure ? 'signedCookies' : 'cookies'
    refreshToken = req[cookies][env.cookieName]
  }

  if (!refreshToken || !REGEX.jwtToken.test(refreshToken))
    return next(INVALID_TOKEN_ERROR)

  const user = await User.findOne({ refreshToken }).select(
    defaultSelectsAnd('refreshToken')
  )

  if (!user || user.refreshToken !== refreshToken) return next(INVALID_TOKEN_ERROR)

  // Will throw an error for invalid or expired tokens
  await promisify(jwt.verify)(refreshToken, env.refreshTokenSecret)

  // REFRESH TOKEN ROTATION
  user.refreshToken = req.refreshTokenManager(user.email)
  await user.save()

  res.sendResponse({
    accessToken: signToken(user.email),
    refreshToken: req.getTokenOnMobileRequest(user.refreshToken),
    status: STATUS.success.created
  })
})

exports.protect = catchAsync(async (req, _, next) => {
  const { authorization } = req.headers
  const token =
    authorization && REGEX.bearerJwtToken.test(authorization)
      ? authorization.split(' ')[1]
      : null

  if (!token) return next(INVALID_TOKEN_ERROR)

  const decoded = await promisify(jwt.verify)(token, env.accessTokenSecret)

  const user = await User.findOne({ email: decoded.email }).select(
    defaultSelectsAnd('isActive', 'isVerified', 'refreshToken')
  )

  if (!user || !user.isActive) return next(INVALID_TOKEN_ERROR)
  if (!user.isVerified || user.refreshToken === undefined)
    return next(new AppError('Please log in', STATUS.error.unauthorized))

  req.currentUser = user
  next()
})

exports.setUserForlogout = async (req, res, next) => {
  req.currentUser.refreshToken = undefined
  req.currentUser.accessCode = undefined
  req.currentUser.accessCodeExpires = undefined

  res.cookie(env.cookieName, 'foo-bar', {
    httpOnly: true,
    secure: false,
    signed: false,
    maxAge: 1000
  })

  next()
}

exports.logout = catchAsync(async ({ currentUser }, res) => {
  await currentUser.save()
  res.sendResponse(DELETE_RESPONSE)
})

exports.permit = (...roles) => {
  if (!roles.length) throw new Error('restrictTo requires at least one valid role')

  // Ensure only valid roles are passed
  roles.forEach(role => {
    if (!VALID_USER_ROLES.includes(role)) {
      throw new Error(`${role} is not a valid role`)
    }
  })

  return ({ currentUser: { role } }, _, next) => {
    if (!roles.includes(role)) {
      return next(
        new AppError(
          'You do not have permission to access this resource',
          STATUS.error.forbidden
        )
      )
    }
    next()
  }
}

// -------------  HELPER MIDDLEWARE
exports.testAccessCodeAnatomy = ({ params, originalUrl }, _, next) => {
  // To prevent querying DB unneccesarilly
  if (!REGEX.accessCode.test(params.accessCode)) {
    return next(
      new AppError(
        `The access code ${params.accessCode} on ${originalUrl} is invalid`,
        STATUS.error.badRequest
      )
    )
  }
  next()
}
