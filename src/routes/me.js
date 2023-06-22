const router = require('express').Router()
const meController = require('../controllers/me')
const userController = require('../controllers/user')
const authController = require('../controllers/auth')
const birthdayController = require('../controllers/birthday')

router.post('/sign-up', userController.createUser)

router.use(authController.protect)
router
  .route('/')
  .get(meController.getMe)
  .patch(meController.updateMe)
  .delete(authController.setUserForlogout, meController.deleteMe)

router.route('/birthdays').post(meController.addBirthday).get(meController.getMyBirthdays)

router
  .route('/birthdays/:id')
  .get(birthdayController.checkUserOwnsBirthday, birthdayController.getBirthday)
  .patch(birthdayController.checkUserOwnsBirthday, birthdayController.updateBirthday)
  .delete(birthdayController.checkUserOwnsBirthday, birthdayController.deleteBirthday)

module.exports = router
