const router = require('express').Router()

const userController = require('../controllers/users')
const authController = require('../controllers/auth')

router.use('/me', require('./me'))

router.use(authController.protect, authController.permit('admin'))
router
  .route('/')
  .get(userController.getUsers)
  .post(userController.setRequestBody, userController.createUser)

router
  .route('/:user_email_phone_id')
  .get(userController.setCustomQueryFromParams, userController.getUser)
  .patch(userController.setCustomQueryFromParams, userController.updateUser)
  .delete(userController.setCustomQueryFromParams, userController.deleteUser)

module.exports = router
