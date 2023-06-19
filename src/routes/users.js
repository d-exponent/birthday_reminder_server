const router = require('express').Router()
const userController = require('../controllers/user')
const middleware = require('../controllers/middleware')

router.route('/').get(userController.getUsers).post(userController.createUser)

router
  .route('/:identifier')
  .get(middleware.setQueryFromIdentifier, userController.getUser)
  .patch(middleware.setQueryFromIdentifier, userController.updateUser)
  .delete(middleware.setQueryFromIdentifier, userController.deleteUser)

module.exports = router
