const { STATUS, RESPONSE, TOKENS } = require('../settings/constants')
const { signToken } = require('../utils/auth')
const env = require('../settings/env')

exports.mountCustomResponse = (_, res, next) => {
  res.customResponse = function (body, type = RESPONSE.success) {
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

exports.mountRefreshTokenCookieManager = (req, res, next) => {
  req.refreshTokenCookieManager = function (email, logout = false) {
    const refreshToken = logout ? 'logout' : signToken(email, TOKENS.refresh)
    const isSecure = this.secure

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
