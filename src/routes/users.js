const router = require('express').Router()

const userController = require('../controllers/users')
// const authController = require('../controllers/auth')

router.use('/me', require('./me'))

// router.use(authController.protect, authController.permit('admin'))

router
  .route('/')
  .get(userController.getUsers)
  .post(userController.setDocumentBody, userController.createUser)

router
  .route('/:id')
  .get(userController.getUser)
  .patch(userController.updateUser)
  .delete(userController.deleteUser)

module.exports = router
