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
  USER_ROLES,
  DELETE_RESPONSE
} = require('../settings/constants')

let errorMessage
let selected

const UNAUTHORIZED = STATUS.error.unauthorized
const INVALID_TOKEN_ERROR = new AppError(
  'Invalid auth credentials',
  UNAUTHORIZED
)
const LOGIN_ERROR = new AppError('Please log in', UNAUTHORIZED)

const getRefreshTokenOnMobile = (req, refreshToken) =>
  req.isMobile ? refreshToken : undefined

exports.requestAccessCode = catchAsync(async (req, res, next) => {
  const user = await User.findOne(req.customQuery).select(
    defaultSelectsAnd('isActive')
  )

  if (!user || !user.isActive) {
    return next(new AppError('The user does not exist', STATUS.error.notFound))
  }

  user.accessCode = generateAccessCode()
  user.accessCodeExpires = timeInMinutes(10)
  await user.save()
  const emailer = new Email(user.name, user.email)

  const message = `An access code has been sent to ${user.email}. Expires in ten (10) minutes`
  errorMessage = `Error sending ${user.email} an access code`

  /**
   * Vercel seems to block nodemailer if the emailing action is not awaited with async/await
   * This custom vercel implementation produces a slow response running up to seconds...
   */
  if (env.isVercel) {
    try {
      await emailer.sendAccessCode(user.accessCode)
      res.sendResponse({ message })
    } catch (err) {
      res.sendResponse({ message: errorMessage })
      errorMessage = err.message || errorMessage
      commitError(new EmailError(errorMessage)).catch(e =>
        console.error(e.message)
      )
    }
    return
  }

  /**
   * Faster response (ms) but without guarantee of success before notifying the client
   * The client may have to try again if email is not received after a some seconds
   */

  emailer.sendAccessCode(user.accessCode).catch(async () => {
    try {
      await emailer.sendAccessCode(user.accessCode) // TRY AGAIN
    } catch (err) {
      errorMessage = err.message || errorMessage
      commitError(new EmailError(errorMessage)).catch(e => console.error(e))
    }
  })
  res.sendResponse({ message })
})

exports.login = catchAsync(async (req, res, next) => {
  const user = await User.findOne(req.customQuery).select(
    defaultSelectsAnd('accessCodeExpires', 'role', 'isVerified')
  )

  if (!user || Date.now() > user.accessCodeExpires.getTime()) {
    return next(new AppError('Invalid access code', UNAUTHORIZED))
  }

  const firstLogin = !user.isVerified

  user.accessCode = undefined
  user.accessCodeExpires = undefined
  user.isVerified = true
  user.refreshToken = req.refreshTokenManager(user.email)
  await user.save()

  res.sendResponse({
    accessToken: signToken(user.email),
    refreshToken: getRefreshTokenOnMobile(req, user.refreshToken),
    data: excludeNonDefaults(user)
  })

  if (firstLogin) {
    new Email(user.name, user.email).sendWelcome().catch(error => {
      const e = new EmailError(error.message)
      commitError(e).catch(err => console.error(err))
    })
  }
})

exports.logout = catchAsync(async ({ currentUser }, res) => {
  await currentUser.save()
  res.sendResponse(DELETE_RESPONSE)
})

exports.getAccessToken = catchAsync(async (req, res, next) => {
  let refreshToken
  if (req.isMobile) {
    refreshToken = req.body.refreshToken
  } else {
    const cookies = req.isSecure ? 'signedCookies' : 'cookies'
    refreshToken = req[cookies][env.cookieName]
  }

  if (!refreshToken || !REGEX.jwtToken.test(refreshToken))
    return next(INVALID_TOKEN_ERROR)

  const user = await User.findOne({ refreshToken }).select(
    defaultSelectsAnd('refreshToken')
  )

  if (!user || user.refreshToken !== refreshToken)
    return next(INVALID_TOKEN_ERROR)

  // Will throw an error for invalid or expired tokens
  await promisify(jwt.verify)(refreshToken, env.refreshTokenSecret)

  // REFRESH TOKEN ROTATION
  user.refreshToken = req.refreshTokenManager(user.email)
  await user.save()

  res.sendResponse({
    accessToken: signToken(user.email),
    refreshToken: getRefreshTokenOnMobile(req, user.refreshToken),
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
  selected = defaultSelectsAnd('isActive', 'role', 'isVerified')
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
  next()
}

exports.permit = (...args) => {
  // Ensure at least one role is passed
  if (!args.length)
    throw new Error('restrictTo requires at least one valid role')

  // Ensure only valid roles  are passed
  args.forEach(arg => {
    if (!USER_ROLES.includes(arg)) {
      throw new Error(`${arg} is not a valid role`)
    }
  })

  return (req, _, next) => {
    if (!args.includes(req.currentUser.role)) {
      errorMessage = 'You do not have permission to access this resource'
      return next(new AppError(errorMessage, STATUS.error.forbidden))
    }

    next()
  }
}

// -------------  HELPER MIDDLEWARE
exports.testAccessCodeAnatomy = (req, _, next) => {
  const { customQuery, params, originalUrl } = req

  if (!REGEX.accessCode.test(params.accessCode)) {
    errorMessage = `The access code ${params.accessCode} on ${originalUrl} is invalid`
    return next(new AppError(errorMessage, STATUS.error.badRequest))
  }

  customQuery.accessCode = params.accessCode
  next()
}
