const router = require('express').Router()

const meController = require('../controllers/me')
const userController = require('../controllers/users')
const authController = require('../controllers/auth')
const birthdayController = require('../controllers/birthdays')

const multerCatchImageCover = birthdayController.upload.single('cover')

router.post('/sign-up', userController.setDocumentBody, userController.createUser)

router.use(authController.protect)

router
  .route('/')
  .delete(authController.setUserForlogout, meController.deleteMe)
  .get(meController.setMyIdOnParams, userController.getUser)
  .patch(
    meController.setMyIdOnParams,
    meController.restrictToUpdate,
    userController.updateUser
  )

router
  .route('/birthdays')
  .get(meController.setBodyAddOwner, birthdayController.getBirthdays)
  .post(
    meController.setMyIdOnParams,
    multerCatchImageCover,
    birthdayController.processImageUpload,
    birthdayController.addBirthday
  )

router
  .route('/birthdays/:id')
  .get(meController.checkUserOwnsBirthday, meController.getBirthday)
  .delete(meController.checkUserOwnsBirthday, birthdayController.deleteBirthday)
  .patch(
    meController.checkUserOwnsBirthday,
    multerCatchImageCover,
    birthdayController.processImageUpload,
    birthdayController.updateBirthday
  )

router
  .route('/birthdays/images/:imageName')
  .delete(birthdayController.checkUserOwnsImage, birthdayController.deleteImage)

module.exports = router
