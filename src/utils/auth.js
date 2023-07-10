const env = require('../settings/env')
const jwt = require('jsonwebtoken')
const { TOKENS } = require('../settings/constants')

exports.generateRandomNumber = () => Math.round(Math.random() * 9)

exports.generateAccessCode = (length = 4) => {
  return [...Array(length)].map(this.generateRandomNumber).join('')
}

exports.getTimeIn = (minutes = 0) => new Date(Date.now() + minutes * 60000)

exports.signToken = (email, type = TOKENS.access) => {
  const allowedTokenTypes = Object.values(TOKENS)

  if (!allowedTokenTypes.includes(type)) {
    const types = allowedTokenTypes.map(t => `/${t}/`).join(', ')
    throw new Error(`type must be one off ${types}`)
  }

  const isAccessToken = type === TOKENS.access
  const secret = isAccessToken ? env.accessTokenSecret : env.refreshTokenSecret
  const expiresIn = isAccessToken
    ? env.accessTokenExpires
    : env.refreshTokenExpires

  return jwt.sign({ email }, secret, { expiresIn })
}

exports.refreshTokenCookieManager = (res, email, logout = false) => {
  const refreshToken = logout ? 'logout' : this.signToken(email, TOKENS.refresh)
  const isProduction = env.isProduction

  res.cookie(env.cookieName, refreshToken, {
    httpOnly: isProduction,
    signed: isProduction,
    secure: isProduction,
    maxAge: logout ? 1000 : env.refreshTokenExpires * 1000
  })

  return refreshToken
}
