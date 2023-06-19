const router = require('express').Router()
const authController = require('../controllers/auth')
const middleware = require('../controllers/middleware')

router.get('/tokens', authController.getAccessToken)

router
  .route('/login/:identifier')
  .get(middleware.setQueryFromIdentifier, authController.requestAccessCode)
  .patch(middleware.setQueryFromIdentifier, authController.login)

module.exports = router
