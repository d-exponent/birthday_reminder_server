/* eslint-disable no-param-reassign */
const { STATUS, RESPONSE, TOKENS } = require('../settings/constants')
const { signToken } = require('../utils/auth')
const env = require('../settings/env')

exports.mountCustomResponse = (_, res, next) => {
  res.customResponse = function customResponse(body, type = RESPONSE.success) {
    if (type.match(/error/i)) {
      body.status = body.status || STATUS.error.serverError
      body.success = false
    } else if (type.match(/success/i)) {
      body.status = body.status || STATUS.success.ok
      body.success = true
    } else {
      throw new TypeError('type parameter must be either "error" or "success"')
    }

    this.status(body.status).json({ ...body, status: undefined })
  }
  next()
}

exports.mountRefreshTokenManager = (req, res, next) => {
  req.refreshTokenManager = function refreshTokenManager(email, logout = false) {
    const refreshToken = logout ? 'logout' : signToken(email, TOKENS.refresh)
    const isSecure = env.isSecure(this)

    res.cookie(env.cookieName, refreshToken, {
      httpOnly: isSecure,
      signed: isSecure,
      secure: isSecure,
      maxAge: logout ? 1000 : env.refreshTokenExpires * 1000
    })
    return refreshToken
  }
  next()
}

// To test successfull deployment to vercel. Might be deleted
exports.showAppIsRunning = (_, res) => {
  res.status(200).send('App is running')
}
