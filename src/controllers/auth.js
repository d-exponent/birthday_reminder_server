const jwt = require('jsonwebtoken')

const env = require('../env')
const User = require('../models/user')
const Email = require('../features/email')
const AppError = require('../utils/appError')
const catchAsync = require('../utils/catchAsync')
const { sendResponse, baseSelect } = require('../utils/contollers')
const { HTTP_STATUS_CODES, RESPONSE_TYPE, REGEX } = require('../constants')
const {
  generateAccessCode,
  getTimeIn,
  signRefreshToken,
  accessTokenCookieManager
} = require('../utils/auth')

const UNAUTHORIZE_STATUS = HTTP_STATUS_CODES.error.unauthorized
const NOT_FOUND_STATUS = HTTP_STATUS_CODES.error.notFound

let DB_USER
let ERROR

exports.requestAccessCode = catchAsync(async (req, res, next) => {
  DB_USER = await User.findOne(req.identifierQuery)
  console.log(DB_USER)

  if (!DB_USER) {
    ERROR = new AppError('The user was not found', NOT_FOUND_STATUS)
    return next(ERROR)
  }

  DB_USER.accessCode = generateAccessCode()
  DB_USER.accessCodeExpires = getTimeIn((minutes = 10))
  DB_USER.verfied = false
  await DB_USER.save()

  const { name, email, accessCode } = DB_USER
  const message = `An access code has been sent to ${DB_USER.email}. Expires in ten (10) minutes`

  await new Email(name, email).sendAccessCode(accessCode)
  sendResponse(RESPONSE_TYPE.success, res, { message })
})

exports.login = catchAsync(async (req, res, next) => {
  DB_USER = await User.findOne(req.identifierQuery).select(
    baseSelect('accessCodeExpires')
  )

  if (!DB_USER) {
    ERROR = new AppError('Invalid access code', UNAUTHORIZE_STATUS)
    return next(ERROR)
  }

  if (Date.now() > DB_USER.accessCodeExpires.getTime()) {
    return next(new AppError('Expired credentails', UNAUTHORIZE_STATUS))
  }

  const accessToken = accessTokenCookieManager(res, DB_USER.email)
  const refreshToken = signRefreshToken(DB_USER.email)

  DB_USER.accessCode = undefined
  DB_USER.accessCodeExpires = undefined
  DB_USER.verfied = true
  DB_USER.refreshToken = refreshToken

  await DB_USER.save()
  sendResponse(RESPONSE_TYPE.success, res, {
    data: {
      ...JSON.parse(JSON.stringify(DB_USER)),
      refreshToken: undefined,
      verfied: undefined
    },
    accessToken,
    refreshToken
  })
})

exports.getTokens = catchAsync(async ({ headers, body: { email } }, res, next) => {
  const refreshToken = headers['x-auth-refresh']
  if (!refreshToken) {
    return next(new AppError('Invalid token', UNAUTHORIZE_STATUS))
  }

  email = email.toLowerCase()
  DB_USER = await User.findOne({ email }).select(baseSelect('refreshToken'))

  const invalidAuthCredentialsMsg = 'Invalid auth credentials'

  if (!DB_USER) {
    return next(new AppError(invalidAuthCredentialsMsg, UNAUTHORIZE_STATUS))
  }

  if (DB_USER.refreshToken !== refreshToken) {
    return next(new AppError(invalidAuthCredentialsMsg, UNAUTHORIZE_STATUS))
  }

  try {
    jwt.verify(refreshToken, env.refreshTokenSecret)
  } catch (e) {
    DB_USER.refreshToken = undefined
    DB_USER.save().catch((e) => console.error(e.message))
    return next(e)
  }

  const newRefreshToken = signRefreshToken(DB_USER.email)
  DB_USER.refreshToken = newRefreshToken
  await DB_USER.save()

  sendResponse(RESPONSE_TYPE.success, res, {
    refreshToken: newRefreshToken,
    accessToken: accessTokenCookieManager(res, email),
    status: HTTP_STATUS_CODES.success.created
  })
})

exports.authenticate = catchAsync(async (req, _, next) => {

  
  let token
  const appJwtCookie = req.secureCookies || null
  let headerBearer = req.headers['authorization'] || null

  if (headerBearer && REGEX.bearerJwtToken.test(headerBearer)) {
    console.log('🛑🛑 BEAERER TOKEN', headerBearer)
    // token = headerBearer.split(' ')[1]
  }

  // SECURE COOKIES TAKE PRIORITY
  if (appJwtCookie && REGEX.jwtToken.test(appJwtCookie)) {
    console.log('🛑Secure Cookies', req.secureCookies)
    // token = req.secureCookies
  }

  next()
})
