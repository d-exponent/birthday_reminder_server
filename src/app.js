// eslint-disable-next-line import/no-extraneous-dependencies
const express = require('express')
const cors = require('cors')
const cookieParser = require('cookie-parser')
const mongoSanitize = require('express-mongo-sanitize')
const rateLimit = require('express-rate-limit')
const morgan = require('morgan')
const compression = require('compression')

const app = express()
const apiV1Routes = require('./routes/api-v1')
const env = require('./settings/env')
const connectDB = require('./utils/db-connect')
const appController = require('./controllers/app')
const errorController = require('./controllers/errors')

// MIDDLEWARE CONFIGS
const rateLimitConfig = {
  windowMs: 900000, // 15 minutes
  max: env.isProduction ? 500 : 1000,
  standardHeaders: true,
  legacyHeaders: false
}

const logConnectMsg = () => {
  let firstRequest = 0

  return msg => {
    if (firstRequest === 0) {
      // eslint-disable-next-line no-unused-expressions
      msg.message ? console.error(msg.message) : console.log(msg)
      firstRequest += 1
    }
  }
}

const logger = logConnectMsg()
const DbConnector = (_, __, next) => {
  connectDB().then(logger).catch(logger)
  next()
}

module.exports = () => {
  app.use(cors({ origin: env.allowedOrigins }))
  app.get('/', appController.showAppIsRunning)

  app.use(DbConnector)
  app.use(appController.mountCustomResponse)
  app.use(appController.mountRefreshTokenManager)

  // eslint-disable-next-line no-unused-expressions
  !env.isProduction && app.use(morgan('dev'))

  app.use(cookieParser(env.cookieSecret))
  app.use(rateLimit(rateLimitConfig))
  app.use(compression())
  app.use(express.json())
  app.use(mongoSanitize())

  app.use('/api/v1', apiV1Routes)
  app.use('*', errorController.wildRoutesHandler)
  app.use(errorController.globalErrorHandler)

  return app
}
