const router = require('express').Router()
const authController = require('../controllers/auth')
const userController = require('../controllers/users')

router.get(
  '/logout',
  authController.protect,
  authController.setUserForlogout,
  authController.logout
)

router.get('/refresh', authController.getAccessToken)

router.get(
  '/:user_email_phone_id',
  userController.setCustomQueryFromParams,
  authController.requestAccessCode
)

router.get(
  '/login/:user_email_phone_id/:accessCode',
  userController.setCustomQueryFromParams,
  authController.validateAccessCodeSetCustomQuery,
  authController.login
)

module.exports = router
