/* eslint-disable no-param-reassign */
const userAgent = require('express-useragent')
const env = require('../settings/env')
const connect = require('../lib/db-connect')
const { signToken } = require('../lib/auth')
const { defineGetter } = require('../lib/utils')
const { STATUS, RESPONSE, TOKENS } = require('../settings/constants')

exports.assignPropsOnRequest = (req, res, next) => {
  defineGetter(req, 'isSecure', function isSecure() {
    return env.isVercel && env.isProduction ? true : this.secure
  })

  defineGetter(req, 'domain', function domain() {
    const proto = this.isSecure ? 'https' : 'http'
    return `${proto}://${this.get('host')}`
  })

  defineGetter(req, 'isMobile', function isMobile() {
    const agent = userAgent.parse(this.headers['user-agent'])
    return agent.isMobile
  })

  req.refreshTokenManager = function refreshTokenManager (email) {
    const { isSecure, domain, isMobile } = this
    const refreshToken = signToken(email, TOKENS.refresh)

    if(isMobile) return refreshToken
    
    res.cookie(env.cookieName, refreshToken, {
      domain,
      path: '/',
      httpOnly: isSecure,
      secure: isSecure,
      signed: isSecure,
      sameSite: false,
      maxAge: env.refreshTokenExpires * 1000
    })
    return refreshToken
  }
  next()
}

exports.assignPropsOnResponse = (_, res, next) => {
  res.sendResponse = (body, type = RESPONSE.success) => {
    if (type.match(/error/i)) {
      body.status = body.status || STATUS.error.serverError
      body.success = false
    } else if (type.match(/success/i)) {
      body.status = body.status || STATUS.success.ok
      body.success = true
    } else {
      throw new TypeError('type parameter must be either "error" or "success"')
    }
    res.status(body.status).json({ ...body, status: undefined })
  }
  next()
}

// Convinience Method For Vercel Deployment screen
exports.showAppIsRunning = (_, res) => res.status(200).send('App is running')

exports.initDB = (_, __, next) => {
  connect().then(connect.logOnFirstRequest).catch(connect.logOnFirstRequest)
  next()
}
