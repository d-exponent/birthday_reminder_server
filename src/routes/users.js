const router = require('express').Router()

const userController = require('../controllers/users')
const authController = require('../controllers/auth')
const middleware = require('../controllers/middlewares')

router.use(authController.protect, authController.restrictTo('admin'))
router.route('/').get(userController.getUsers).post(userController.createUser)

router
  .route('/:identifier')
  .get(middleware.setMongooseFindParams, userController.getUser)
  .patch(middleware.setMongooseFindParams, userController.updateUser)
  .delete(middleware.setMongooseFindParams, userController.deleteUser)

module.exports = router
