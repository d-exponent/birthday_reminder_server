const env = require('../env')
const jwt = require('jsonwebtoken')

exports.generateAccessCode = () => {
  return [...Array(4).keys()].map(() => Math.round(Math.random() * 9)).join('')
}

exports.getTimeIn = (minutes = 0) => new Date(Date.now() + minutes * 60000)

exports.validateEmail = (email) => {
  const rfc5322StandardEmailRegex =
    /(?:[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*|"(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21\x23-\x5b\x5d-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])*")@(?:(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?|\[(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?|[a-z0-9-]*[a-z0-9]:(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21-\x5a\x53-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])+)\])/gi

  return rfc5322StandardEmailRegex.test(email)
}

exports.validatePhoneNumber = (phoneNumber) => {
  const phoneNumberReg = /^\+(?:[0-9] ?){6,14}[0-9]$/
  return phoneNumberReg.test(phoneNumber)
}

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
