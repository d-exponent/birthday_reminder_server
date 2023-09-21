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
const appController = require('./controllers/app')
const errorController = require('./controllers/errors')
const { CORSOriginSetter } = require('./lib/auth')

const rateLimitConfig = {
  windowMs: 900000, // 15 minutes
  max: env.isProduction ? 500 : 1000,
  standardHeaders: true,
  legacyHeaders: false
}

const corsConfig = {
  origin: CORSOriginSetter,
  credentials: true,
  optionSuccessStatus: 200
}

module.exports = () => {
  app.get('/', appController.showAppIsRunning)
  app.options('*', cors(corsConfig))

  app.use(cors(corsConfig))
  app.use(rateLimit(rateLimitConfig))
  app.use(cookieParser(env.cookieSecret))
  app.use(compression())
  app.use(express.json())

  // eslint-disable-next-line no-unused-expressions
  !env.isProduction && app.use(morgan('dev'))

  app.use(appController.initDB)
  app.use(appController.assignPropsOnRequest)
  app.use(appController.assignPropsOnResponse)

  app.use('/api/v1', mongoSanitize(), apiV1Routes)
  app.use('*', errorController.wildRoutesHandler)
  app.use(errorController.globalErrorHandler)
  return app
}
