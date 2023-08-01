const cors = require('cors')
const express = require('express')
const cookieParser = require('cookie-parser')
const mongoSanitize = require('express-mongo-sanitize')
const rateLimit = require('express-rate-limit')
const morgan = require('morgan')

const app = express()
const apiV1Router = require('./routes/api-v1')
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
  res.send('App is up and running')
}

module.exports = () => {
  app.use(cors(corsConfig))
  app.use(rateLimit(rateLimitConfig))
  app.use(express.json())
  app.use(mongoSanitize())
  app.use(cookieParser(env.cookieSecret))
  !env.isProduction && app.use(morgan('dev'))

  app.use(appController.mountCustomResponse)
  app.use(appController.mountRefreshTokenManager)

  app.get('/', homeController)
  app.use('/api/v1', apiV1Router)
  app.use('*', errorController.wildRoutesHandler)
  app.use(errorController.globalErrorHandler)

  return app
}
