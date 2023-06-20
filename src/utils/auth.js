const env = require('../env')
const jwt = require('jsonwebtoken')

exports.generateAccessCode = () => {
  return [...Array(4).keys()].map(() => Math.round(Math.random() * 9)).join('')
}

exports.getTimeIn = (minutes = 0) => new Date(Date.now() + minutes * 60000)

exports.signRefreshToken = (email) => {
  return jwt.sign({ email }, env.refreshTokenSecret, {
    expiresIn: env.refreshTokenExpires
  })
}

exports.accessTokenCookieManager = (res, email, logout = false) => {
  const token = logout
    ? 'logout_token'
    : jwt.sign({ email }, env.accessTokenSecret, {
        expiresIn: env.accessTokenExpires
      })

  res.cookie(env.cookieName, token, {
    httpOnly: true,
    signed: !logout,
    secure: env.isProduction,
    maxAge: logout ? 5000 : env.accessTokenExpires * 1000
  })

  return token
}
