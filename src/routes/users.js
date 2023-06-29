const router = require('express').Router()

const userController = require('../controllers/users')
const authController = require('../controllers/auth')
const middleware = require('../controllers/middlewares')

router.use('/me', require('./me'))

router.use(authController.protect, authController.permit('admin'))
router
  .route('/')
  .get(userController.getUsers)
  .post(middleware.setRequestBody, userController.createUser)

router
  .route('/:user_email_phone_id')
  .get(middleware.setCustomQueryFromParams, userController.getUser)
  .patch(middleware.setCustomQueryFromParams, userController.updateUser)
  .delete(middleware.setCustomQueryFromParams, userController.deleteUser)

module.exports = router
