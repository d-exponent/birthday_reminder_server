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
const { STATUS, REGEX, USER_ROLES, DELETE_RESPONSE } = require('../settings/constants')

const INVALID_TOKEN_ERROR = new AppError(
  'Invalid auth credentials',
  STATUS.error.unauthorized
)

const LOGIN_ERROR = new AppError('Please log in', STATUS.error.unauthorized)

const getRefreshTokenOnMobile = (isMobileRequest, refreshToken) =>
  isMobileRequest ? refreshToken : undefined

const handleCommitError = message => {
  commitError(new EmailError(message)).catch(e => {
    // eslint-disable-next-line no-console
    console.error(e.message)
  })
}

exports.requestAccessCode = catchAsync(async (req, res, next) => {
  const user = await User.findOne(req.customQuery).select(defaultSelectsAnd('isActive'))

  if (!user || !user.isActive)
    return next(new AppError('The user does not exist', STATUS.error.notFound))

  user.accessCode = generateAccessCode()
  user.accessCodeExpires = timeInMinutes(10)
  await user.save()

  const emailInsatnce = new Email(user.name, user.email)
  const message = `An access code has been sent to ${user.email}. Expires in ten (10) minutes`
  const errorMessage = `Error sending ${user.email} an access code`

  if (env.isVercel) {
    try {
      /**
       * Vercel seems to block nodemailer if the emailing action is not executed with async/await
       * This custom vercel implementation produces a slow response possibly running up to seconds...
       */

      await emailInsatnce.sendAccessCode(user.accessCode)
      res.sendResponse({ message })
    } catch (e) {
      res.sendResponse({ message: errorMessage })
      handleCommitError(e.message ?? errorMessage)
    }
  } else {
    /**
     * Faster response (ms) but without guarantee of success before notifying the client
     * The client may have to retry if email is not received after a few some seconds
     */

    emailInsatnce.sendAccessCode(user.accessCode).catch(async () => {
      try {
        await emailInsatnce.sendAccessCode(user.accessCode) // TRY AGAIN
      } catch (e) {
        handleCommitError(e.message ?? errorMessage)
      }
    })
    res.sendResponse({ message })
  }
})

exports.submitAccessCode = catchAsync(async (req, res, next) => {
  const user = await User.findOne(req.customQuery).select(
    defaultSelectsAnd('accessCodeExpires', 'role', 'isVerified')
  )

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
    refreshToken: getRefreshTokenOnMobile(req.isMobile, user.refreshToken),
    data: excludeNonDefaults(user)
  })

  // Send welcome email on the first login of a new user
  if (firstLogin) {
    try {
      await new Email(user.name, user.email).sendWelcome()
    } catch (e) {
      handleCommitError(e.message ?? 'Unkown Error')
    }
  }
})

exports.logout = catchAsync(async ({ currentUser }, res) => {
  await currentUser.save()
  res.sendResponse(DELETE_RESPONSE)
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
    refreshToken: getRefreshTokenOnMobile(req.isMobile, user.refreshToken),
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
  if (!user.isVerified || user.refreshToken === undefined) return next(LOGIN_ERROR)

  req.currentUser = user
  next()
})

exports.setUserForlogout = async (req, _, next) => {
  req.currentUser.refreshToken = undefined
  req.currentUser.accessCode = undefined
  req.currentUser.accessCodeExpires = undefined
  next()
}

exports.permit = (...args) => {
  // Ensure at least one role is passed
  if (!args.length) throw new Error('restrictTo requires at least one valid role')

  // Ensure only valid roles are passed
  args.forEach(arg => {
    if (!USER_ROLES.includes(arg)) {
      throw new Error(`${arg} is not a valid role`)
    }
  })

  return (req, _, next) => {
    if (!args.includes(req.currentUser.role)) {
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
exports.testAccessCodeAnatomy = (req, _, next) => {
  const { customQuery, params, originalUrl } = req

  if (!REGEX.accessCode.test(params.accessCode)) {
    return next(
      new AppError(
        `The access code ${params.accessCode} on ${originalUrl} is invalid`,
        STATUS.error.badRequest
      )
    )
  }

  customQuery.accessCode = params.accessCode
  next()
}
