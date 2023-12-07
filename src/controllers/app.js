const userAgent = require('express-useragent')
const morgan = require('morgan')
const env = require('../settings/env')
const connect = require('../lib/db-connect')
const firstRequestManger = require('../lib/manage-first-request')
const { signToken } = require('../lib/auth')
const { STATUS, RESPONSE, TOKENS } = require('../settings/constants')

const defineGetter = (obj, name, getter) => {
  Object.defineProperty(obj, name, {
    configurable: false,
    get: getter
  })
}

exports.assignPropsOnRequest = (req, res, next) => {
  defineGetter(req, 'isSecure', () =>
    env.isVercel && env.isProduction ? true : req.secure
  )

  defineGetter(req, 'domain', function domain() {
    const proto = this.isSecure ? 'https' : 'http' // so it works on vercel or any other deployment platform
    return `${proto}://${this.get('host')}`
  })

  defineGetter(req, 'isMobile', function isMobile() {
    if (this.headers?.platform === 'mobile') return true
    return userAgent.parse(this.headers['user-agent']).isMobile
  })

  req.refreshTokenManager = function refreshTokenManager(email) {
    const refreshToken = signToken(email, TOKENS.refresh)

    // Set cookie header when the request is from a browser
    if (!this.isMobile) {
      const { isSecure } = this
      res.cookie(env.cookieName, refreshToken, {
        httpOnly: isSecure,
        secure: isSecure,
        signed: isSecure,
        maxAge: env.refreshTokenExpires * 1000
      })
    }
    return refreshToken
  }

  req.getTokenOnMobileRequest = function getTokenOnMobileRequest(token) {
    return this.isMobile ? token : undefined
  }
  next()
}

exports.assignPropsOnResponse = (_, res, next) => {
  res.sendResponse = function sendResponse(body, type = RESPONSE.success) {
    const responseBody = { ...body }
    responseBody.success = !!type.match(/success/i)

    if (!responseBody.status)
      responseBody.status = type.match(/error/i)
        ? STATUS.error.serverError
        : STATUS.success.ok

    res.status(responseBody.status).json(responseBody)
  }
  next()
}

const connectLogger = firstRequestManger.logDbConnect.bind(firstRequestManger)

// App wide middlewares
exports.initDB = (_, __, next) => {
  connect().then(connectLogger).catch(connectLogger)
  next()
}

exports.useMorganOnDev = () =>
  env.isProduction ? (_, __, next) => next() : morgan('dev')

//* These methods serve to allow some live enviroment debugging. They <may> be removed later
exports.showAppIsRunning = (_, res) => res.status(200).send('App is running')

exports.showIsMobileReq = (req, res) =>
  res.status(200).json({
    isMobile: req.isMobile,
    ...req.headers
  })
