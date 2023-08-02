const cors = require('cors')
const express = require('express')
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

// MIDDLEWARE CONFIGS
const corsConfig = {
  origin: env.allowedOrigins ? env.allowedOrigins.split(',') : ['*'],
  methods: ['POST', 'GET', 'PATCH', 'DELETE'],
  credentials: true
}

const rateLimitConfig = {
  windowMs: 900000, //15 minutes
  max: env.isProduction ? 500 : 1000,
  standardHeaders: true,
  legacyHeaders: false
}

// To test successfull deployment to vercel. Might be deleted
const homeController = (_, res) => {
  res.send('App is running')
}

module.exports = () => {
  app.use(cors(corsConfig))
  app.use(cookieParser(env.cookieSecret))
  app.use(rateLimit(rateLimitConfig))
  app.use(compression())
  app.use(express.json())
  app.use(mongoSanitize())
  !env.isProduction && app.use(morgan('dev'))

  app.use(appController.mountCustomResponse)
  app.use(appController.mountRefreshTokenManager)

  app.get('/', homeController)

  app.use('/api/v1', apiV1Routes)
  app.use('*', errorController.wildRoutesHandler)
  app.use(errorController.globalErrorHandler)

  return app
}
