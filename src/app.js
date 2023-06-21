const express = require('express')
const cors = require('cors')
const cookieParser = require('cookie-parser')
const mongoSanitize = require('express-mongo-sanitize')
const rateLimit = require('express-rate-limit')
const morgan = require('morgan')

const env = require('./settings/env')
const userRouter = require('./routes/users')
const authRouter = require('./routes/auth')
const errorController = require('./controllers/error')

const rateLimiter = rateLimit({
  windowMs: 20 * 60 * 1000,
  max: 150,
  standardHeaders: true,
  legacyHeaders: false
})

module.exports = () => {
  const app = express()

  app.use(cors())
  app.use(cookieParser(env.cookieSecret))
  app.use(rateLimiter)
  app.use(express.json())
  app.use(mongoSanitize())
  env.nodeEnv === 'development' && app.use(morgan('dev'))

  app.use('/api/users', userRouter)
  app.use('/api/auth', authRouter)

  app.use('*', errorController.wildRoutesHandler)
  app.use(errorController.globalErrorHandler)

  return app
}
