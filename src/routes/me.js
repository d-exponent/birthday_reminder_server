const router = require('express').Router()
const meController = require('../controllers/me')
const userController = require('../controllers/users')
const authController = require('../controllers/auth')
const birthdayController = require('../controllers/birthdays')

router.post('/sign-up', userController.setRequestBody, userController.createUser)

router.use(authController.protect)

router
  .route('/')
  .get(
    meController.setMyIdOnParams,
    userController.setCustomQueryFromParams,
    userController.getUser
  )
  .patch(
    meController.setMyIdOnParams,
    userController.setCustomQueryFromParams,
    meController.restrictToUpdate,
    userController.updateUser
  )
  .delete(authController.setUserForlogout, meController.deleteMe)

router
  .route('/birthdays')
  .post(meController.setMyIdOnParams, birthdayController.addBirthday)
  .get(meController.setBodyAddOwner, birthdayController.getBirthdays)

router
  .route('/birthdays/:id')
  .get(meController.checkUserOwnsBirthday, birthdayController.getBirthday)
  .patch(meController.checkUserOwnsBirthday, birthdayController.updateBirthday)
  .delete(meController.checkUserOwnsBirthday, birthdayController.deleteBirthday)

module.exports = router
