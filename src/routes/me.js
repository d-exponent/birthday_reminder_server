const router = require('express').Router()
const meController = require('../controllers/me')
const userController = require('../controllers/users')
const authController = require('../controllers/auth')
const birthdayController = require('../controllers/birthdays')

router.post('/sign-up', userController.setRequestBody, userController.createUser)

router.use(authController.protect)
router
  .route('/')
  .get(meController.getMe)
  .patch(meController.restrictToUpdate, meController.updateMe)
  .delete(authController.setUserForlogout, meController.deleteMe)

router
  .route('/birthdays')
  .post(meController.addBirthday)
  .get(meController.getMyBirthdays)

router
  .route('/birthdays/:id')
  .get(meController.checkUserOwnsBirthday, birthdayController.getBirthday)
  .patch(meController.checkUserOwnsBirthday, birthdayController.updateBirthday)
  .delete(meController.checkUserOwnsBirthday, birthdayController.deleteBirthday)

module.exports = router
