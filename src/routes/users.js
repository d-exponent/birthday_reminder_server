const router = require('express').Router()

const userController = require('../controllers/user')
const authController = require('../controllers/auth')
const middleware = require('../controllers/middleware')

router.post('/', userController.createUser)

router.use(authController.protect)
router.get('/', authController.restrictTo('user'), userController.getUsers)

router
  .route('/:identifier', middleware.setMongooseFindParams)
  .get(userController.getUser)
  .patch(userController.updateUser)
  .delete(userController.deleteUser)

module.exports = router
