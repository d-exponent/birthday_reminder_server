const router = require('express').Router()
const meController = require('../controllers/me')
const userController = require('../controllers/users')
const authController = require('../controllers/auth')
const birthdayController = require('../controllers/birthdays')
const middleware = require('../controllers/middlewares')

router.post('/sign-up', middleware.setRequestBody, userController.createUser)

router.use(authController.protect)
router
  .route('/')
  .get(meController.getMe)
  .patch(middleware.restrictToUpdate, meController.updateMe)
  .delete(authController.setUserForlogout, meController.deleteMe)

router.route('/birthdays').post(meController.addBirthday).get(meController.getMyBirthdays)

router
  .route('/birthdays/:id')
  .get(middleware.checkUserOwnsBirthday, birthdayController.getBirthday)
  .patch(middleware.checkUserOwnsBirthday, birthdayController.updateBirthday)
  .delete(middleware.checkUserOwnsBirthday, birthdayController.deleteBirthday)

module.exports = router
