const router = require('express').Router()
const meController = require('../controllers/me')
const userController = require('../controllers/users')
const authController = require('../controllers/auth')
const birthdayController = require('../controllers/birthdays')

router.post('/sign-up', userController.setRequestBody, userController.createUser)

router.use(authController.protect)
router
  .route('/')
  .delete(authController.setUserForlogout, meController.deleteMe)
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

router
  .route('/birthdays')
  .get(meController.setBodyAddOwner, birthdayController.getBirthdays)
  .post(
    meController.setMyIdOnParams,
    birthdayController.upload.single('birthdayImage'),
    birthdayController.processImageUpload,
    birthdayController.addBirthday
  )

router
  .route('/birthdays/:id')
  .get(meController.checkUserOwnsBirthday, birthdayController.getBirthday)
  .patch(
    meController.checkUserOwnsBirthday,
    birthdayController.upload.single('birthdayImage'),
    birthdayController.processImageUpload,
    birthdayController.updateBirthday
  )
  .delete(meController.checkUserOwnsBirthday, birthdayController.deleteBirthday)

router
  .route('/birthdays/images/:imageName')
  .get(birthdayController.checkUserOwnsImage, birthdayController.getImage)
  .delete(birthdayController.checkUserOwnsImage, birthdayController.deleteImage)

module.exports = router
