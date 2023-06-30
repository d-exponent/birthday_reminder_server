const env = require('../settings/env')
const jwt = require('jsonwebtoken')
const { TOKENS } = require('../settings/constants')

exports.generateRandomNumber = (limit = 9) => Math.round(Math.random() * limit)

exports.generateAccessCode = () => {
  return [...Array(4).keys()].map(() => this.generateRandomNumber()).join('')
}

exports.getTimeIn = (minutes = 0) => new Date(Date.now() + minutes * 60000)

exports.signToken = (email, type = TOKENS.refresh) => {
  if (!Object.values(TOKENS).includes(type))
    throw new Error('type must be either /refresh/ or /access/')

  const isRefresh = type === TOKENS.refresh
  const secret = isRefresh ? env.refreshTokenSecret : env.accessTokenSecret
  const expiresIn = isRefresh ? env.refreshTokenExpires : env.accessTokenExpires

  return jwt.sign({ email }, secret, { expiresIn })
}

exports.refreshTokenCookieManager = (req, res, email, logout = false) => {
  const refreshToken = logout ? 'logout' : this.signToken(email, TOKENS.refresh)

  res.cookie(env.cookieName, refreshToken, {
    httpOnly: true,
    signed: true,
    secure: req.secure,
    maxAge: logout ? 1000 : env.refreshTokenExpires * 1000
  })

  return refreshToken
}
