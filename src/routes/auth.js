const router = require('express').Router()
const authController = require('../controllers/auth')
const middleware = require('../controllers/middleware')

router.get(
  '/:identifier',
  middleware.setMongooseFindParams,
  authController.requestAccessCode
)

router.get('/login/:accessCode', middleware.setMongooseFindParams, authController.login)
router.get('/tokens', authController.getTokens)

module.exports = router

