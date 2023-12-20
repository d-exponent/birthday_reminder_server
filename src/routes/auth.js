const router = require('express').Router()

const authController = require('../controllers/auth')

router.get('/refresh', authController.getAccessToken)

router.get(
  '/logout',
  authController.protect,
  authController.setUserForlogout,
  authController.logout
)

router.get('/:email', authController.requestAccessCode)

router.get(
  '/login/:email/:accessCode',
  authController.testAccessCodeAnatomy,
  authController.submitAccessCode
)

module.exports = router
