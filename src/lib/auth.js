const jwt = require('jsonwebtoken')
const env = require('../settings/env')
const AppError = require('./app-error')
const { TOKENS, STATUS, CORS_ORIGIN_ERROR } = require('../settings/constants')

const asssertPositiveIntegerOrZero = (num, name) => {
  if (typeof num !== 'number' || num < 0 || num.toString().includes('.'))
    throw new TypeError(`${name} must be a positive integer or zero (0)`)
}

exports.generateAccessCode = (length = 4) => {
  asssertPositiveIntegerOrZero(length, 'length')
  if (length < 4 || length > 8) throw TypeError('length must be between 4 to 8')
  return [...Array(length)].map(() => Math.round(Math.random() * 9)).join('')
}

exports.timeInMinutes = (minutes = 0) => {
  asssertPositiveIntegerOrZero(minutes, 'minutes')
  return new Date(Date.now() + minutes * 60000)
}

exports.signToken = (email, type = TOKENS.access) => {
  const allowedTypes = Object.values(TOKENS)
  if (!allowedTypes.includes(type)) {
    const types = allowedTypes.map(t => `/${t}/`).join(', ')
    throw new TypeError(`type must be one of ${types}`)
  }

  const isAccessToken = type === TOKENS.access
  const secret = isAccessToken ? env.accessTokenSecret : env.refreshTokenSecret
  const expiresIn = isAccessToken ? env.accessTokenExpires : env.refreshTokenExpires
  return jwt.sign({ email }, secret, { expiresIn })
}

exports.CORSOriginSetter = (origin, callback) => {
  // Mobile apps, Curl, Postman
  if (!origin) return callback(null, true)

  // Browsers
  if (env.allowedOrigins.indexOf(origin) === -1)
    callback(new AppError(CORS_ORIGIN_ERROR, STATUS.error.forbidden), false)
  else callback(null, true)
}
