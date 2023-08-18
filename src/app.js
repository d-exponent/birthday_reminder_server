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

const DBConnection = (_, __, next) => {
  // connection error will be caught by catchAsync wrapper of the appropriate model's operation controller
  connectDB().catch(e => console.log(e.message))
  next()
}

module.exports = () => {
  app.use(cors({ origin: env.allowedOrigins }))
  app.get('/', appController.showAppIsRunning)

  app.use(appController.mountCustomResponse)
  app.use(appController.mountRefreshTokenManager)

  // eslint-disable-next-line no-unused-expressions
  env.isVercel && app.use(DBConnection)

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
