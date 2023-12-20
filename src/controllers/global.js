const morgan = require('morgan')
const userAgent = require('express-useragent')

const env = require('../settings/env')
const connect = require('../lib/db-connect')
const FirstRequestManger = require('../lib/first-request-manager')
const { signToken } = require('../lib/auth')
const { STATUS, RESPONSE, TOKENS } = require('../settings/constants')

const defineGetter = (obj, name, getter) => {
  Object.defineProperty(obj, name, {
    configurable: false,
    enumerable: false,
    get: getter
  })
}

exports.assignPropsOnRequest = (req, res, next) => {
  defineGetter(req, 'isSecure', () =>
    env.isVercel && env.isProduction ? true : req.secure
  )

  defineGetter(req, 'domain', function domain() {
    return `${this.isSecure ? 'https' : 'http'}://${this.get('host')}`
  })

  defineGetter(req, 'isMobile', function isMobile() {
    return this.headers.platform === 'mobile'
      ? true
      : userAgent.parse(this.headers['user-agent']).isMobile
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

// App wide middlewares
exports.initDB = (_, __, next) => {
  if (env.isVercel) {
    const connectLogger = FirstRequestManger.logDbConnect.bind(FirstRequestManger)
    connect().then(connectLogger).catch(connectLogger)
  }
  next()
}

exports.useMorganOnDev = () =>
  env.isProduction ? (_, __, next) => next() : morgan('dev')

//* These methods serve to allow some live enviroment debugging. They <may> be removed later
exports.showAppIsRunning = (_, res) => res.status(200).send('App is running')


