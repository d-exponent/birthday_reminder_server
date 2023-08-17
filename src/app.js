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
const connectDB = require('./utils/db-connect')
const appController = require('./controllers/app')
const errorController = require('./controllers/errors')
const catchAsync = require('./utils/catch-async')

// MIDDLEWARE CONFIGS

/**
 * Will be implemented when the client is hosted over https
 */
// const corsConfig = {

//   origin: env.allowedOrigins || "*"
//   methods: ['GET', 'PATCH', 'DELETE', 'POST', 'PUT'],
//   credentials: true,
//   optionSuccessStatus: 204
// }

const rateLimitConfig = {
  windowMs: 900000, //15 minutes
  max: env.isProduction ? 500 : 1000,
  standardHeaders: true,
  legacyHeaders: false
}

const DBConnection = catchAsync(async (_, __, next) => {
  // Vercel free tier is on a short fuse with timeouts. Can't afford to await here
  connectDB()
  next()
})

/**
 * Setting "headers": [...] in vercel.json is failing CI/CD .
 * This is a workaround middleware until client application is hosted for a valid https allowed origin
 */
const allowCors = ({ method, headers }, res, next) => {
  res.setHeader('Access-Control-Allow-Credentials', true)
  res.setHeader('Access-Control-Allow-Methods', 'GET,PATCH,DELETE,POST,PUT')
  res.setHeader(
    'Access-Control-Allow-Origin',
    env.allowedOrigins || headers.origin || '*'
  )

  if (method === 'OPTIONS') {
    res.setHeader('Content-Length', 0)
    res.setHeader('Access-Control-Allow-Headers', 'Authorization')
    res.setHeader('Access-Control-Max-Age', 86400) //24 hours
    return res.status(204).send('')
  }
  next()
}

module.exports = () => {
  app.use(allowCors)
  app.get('/', appController.showAppIsRunning)

  app.use(appController.mountCustomResponse)
  app.use(appController.mountRefreshTokenManager)

  env.isVercel && app.use(DBConnection)
  !env.isProduction && app.use(morgan('dev'))
  // app.use(cors(corsConfig))

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
