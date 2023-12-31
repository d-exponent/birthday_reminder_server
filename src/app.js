const cors = require('cors')
const express = require('express')
const compression = require('compression')
const cookieParser = require('cookie-parser')
const rateLimit = require('express-rate-limit')
const mongoSanitize = require('express-mongo-sanitize')

const appController = require('./controllers/global')
const errorController = require('./controllers/errors')
const authController = require('./controllers/auth')
const apiV1RoutesController = require('./routes/api-v1')

const { CORSOriginSetter } = require('./lib/auth')
const { isProduction, cookieSecret } = require('./settings/env')
const FRM = require('./lib/first-request-manager')

const rateLimitConfig = {
  windowMs: 900000, // 15 minutes
  max: isProduction ? 1000 : 4000,
  standardHeaders: true,
  legacyHeaders: false
}

const corsConfig = {
  origin: CORSOriginSetter,
  credentials: true,
  optionSuccessStatus: 200
}

module.exports = () => {
  const app = express()

  app.set('trust proxy', 'loopback')

  app.options('*', cors(corsConfig))

  app.use(cors(corsConfig))
  app.use(rateLimit(rateLimitConfig))
  app.use(cookieParser(cookieSecret))
  app.use(compression())
  app.use(express.json())

  app.use(appController.initDB)
  app.use(FRM.prepImagesDir.bind(FRM))
  app.use(appController.assignPropsOnRequest)
  app.use(appController.assignPropsOnResponse)
  app.use(appController.useMorganOnDev())

  app.get(
    '/test',
    authController.protect,
    authController.permit('admin'),
    appController.seeRequest
  )

  app.use('/api/v1', mongoSanitize(), apiV1RoutesController)
  app.use('*', errorController.wildRoutesHandler)
  app.use(errorController.globalErrorHandler)

  return app
}
