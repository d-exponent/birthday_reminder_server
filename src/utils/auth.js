const env = require('../settings/env')
const jwt = require('jsonwebtoken')

exports.generateRandomNumber = (limit = 9) => Math.round(Math.random() * limit)

exports.generateAccessCode = () => {
  return [...Array(4).keys()].map(() => this.generateRandomNumber()).join('')
}

exports.getTimeIn = (minutes = 0) => new Date(Date.now() + minutes * 60000)

exports.signRefreshToken = (email) => {
  return jwt.sign({ email }, env.refreshTokenSecret, {
    expiresIn: env.refreshTokenExpires
  })
}

exports.accessTokenCookieManager = (req, res, email, logout = false) => {
  const token = logout
    ? 'logout'
    : jwt.sign({ email }, env.accessTokenSecret, {
        expiresIn: env.accessTokenExpires
      })

  res.cookie(env.cookieName, token, {
    httpOnly: true,
    signed: true,
    secure: req.secure,
    maxAge: logout ? 2000 : env.accessTokenExpires * 1000
  })

  return token
}
