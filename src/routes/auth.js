const authRouter = require('express').Router()
const authController = require('../controllers/auth')
const middleware = require('../controllers/middleware')

authRouter.get(
  '/:identifier',
  middleware.setMongooseFindParams,
  authController.requestAccessCode
)

authRouter.get(
  '/login/:accessCode',
  middleware.setMongooseFindParams,
  authController.login
)
authRouter.get('/tokens', authController.getTokens)

module.exports = authRouter
