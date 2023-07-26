const env = require('../settings/env')
const jwt = require('jsonwebtoken')
const { TOKENS } = require('../settings/constants')

const asssertPositiveIntegerOrZero = (num, name) => {
  if (typeof num !== 'number' || num < 0 || num.toString().includes('.'))
    throw new TypeError(`${name} must be a positive integer or zero (0)`)
}

exports.generateAccessCode = (length = 4) => {
  asssertPositiveIntegerOrZero(length, 'length')
  if (length < 4 || length > 8) throw TypeError('length must between 4 to 8')
  return [...Array(length)].map(_ => Math.round(Math.random() * 9)).join('')
}

exports.getTimeIn = (minutes = 0) => {
  asssertPositiveIntegerOrZero(minutes, 'minutes')
  return new Date(Date.now() + minutes * 60000)
}

exports.signToken = (email, type = TOKENS.access) => {
  const allowedTokenTypes = Object.values(TOKENS)

  if (!allowedTokenTypes.includes(type)) {
    const types = allowedTokenTypes.map(t => `/${t}/`).join(', ')
    throw new TypeError(`type must be one off ${types}`)
  }

  const isAccessToken = type === TOKENS.access
  const secret = isAccessToken ? env.accessTokenSecret : env.refreshTokenSecret
  const expiresIn = isAccessToken ? env.accessTokenExpires : env.refreshTokenExpires
  const token = jwt.sign({ email }, secret, { expiresIn })
  return token
}


