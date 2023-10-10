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
  defineGetter(req, 'isSecure', function isSecure() {
    return env.isVercel && env.isProduction ? true : this.secure
  })

  defineGetter(req, 'domain', function domain() {
    const proto = this.isSecure ? 'https' : 'http'
    return `${proto}://${this.get('host')}`
  })

  defineGetter(req, 'isMobile', function isMobile() {
    const agent = userAgent.parse(this.headers['user-agent'])
    return agent.isMobile // Boolean
  })

  req.refreshTokenManager = function refreshTokenManager(email) {
    const { isSecure, isMobile } = this
    const refreshToken = signToken(email, TOKENS.refresh)

    if (!isMobile) {
      res.cookie(env.cookieName, refreshToken, {
        httpOnly: isSecure,
        secure: isSecure,
        signed: isSecure,
        maxAge: env.refreshTokenExpires * 1000
      })
    }
    return refreshToken
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

// Convinience Method For Vercel Deployment screen
exports.showAppIsRunning = (_, res) => res.status(200).send('App is running')

const connectLogger = firstRequestManger.logDbConnect.bind(firstRequestManger)

exports.initDB = (_, __, next) => {
  connect().then(connectLogger).catch(connectLogger)
  next()
}

exports.useMorganOnDev = () =>
  env.isProduction ? (_, __, next) => next() : morgan('dev')
