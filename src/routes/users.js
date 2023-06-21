const usersRouter = require('express').Router()

const userController = require('../controllers/user')
const authController = require('../controllers/auth')
const middleware = require('../controllers/middleware')

usersRouter
  .route('/')
  .post(userController.createUser)
  .get(
    authController.protect,
    authController.restrictTo('user'),
    userController.getUsers
  )

usersRouter.use(authController.protect)
usersRouter
  .route('/:identifier')
  .get(middleware.setMongooseFindParams, userController.getUser)
  .patch(middleware.setMongooseFindParams, userController.updateUser)
  .delete(middleware.setMongooseFindParams, userController.deleteUser)

module.exports = usersRouter
