const router = require('express').Router()
const authController = require('../controllers/auth')
const middleware = require('../controllers/middlewares')

router.get(
  '/logout',
  authController.protect,
  authController.setUserForlogout,
  authController.logout
)

router.get('/tokens', authController.getTokens)

router.get(
  '/:user_email_phone_id',
  middleware.setCustomQueryFromParams,
  authController.requestAccessCode
)

router.get(
  '/login/:accessCode',
  middleware.validateAccessCodeAnatomy,
  authController.login
)

module.exports = router
