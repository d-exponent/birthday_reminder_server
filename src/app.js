const express = require('express')
const cors = require('cors')
const cookieParser = require('cookie-parser')
const mongoSanitize = require('express-mongo-sanitize')
const rateLimit = require('express-rate-limit')
const morgan = require('morgan')

const env = require('./settings/env')
const errorController = require('./controllers/errors')
const isProduction = env.isProduction

// MIDDLEWARE CONFIGS
const corsConfig = {
  origin: env.allowedOrigin,
  methods: ['POST', 'GET', 'PATCH', 'DELETE'],
  credentials: true
}

const rateLimitConfig = {
  windowMs: 1800000, //30 minutes
  max: isProduction ? 100 : 1000,
  standardHeaders: true,
  legacyHeaders: false
}

module.exports = () => {
  const app = express()

  app.use(cors(corsConfig))
  app.use(express.json())
  app.use(cookieParser(env.cookieSecret))
  app.use(rateLimit(rateLimitConfig))
  app.use(mongoSanitize())
  !isProduction && app.use(morgan('dev'))

  app.use('/api/auth', require('./routes/auth'))
  app.use('/api/users', require('./routes/users'))
  app.use('/api/birthdays', require('./routes/birthdays'))

  app.use('*', errorController.wildRoutesHandler)
  app.use(errorController.globalErrorHandler)

  return app
}
