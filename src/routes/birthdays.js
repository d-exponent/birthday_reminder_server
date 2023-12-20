const router = require('express').Router()

const birthdayController = require('../controllers/birthdays')
const authController = require('../controllers/auth')

router.use(authController.protect, authController.permit('admin'))

router
  .route('/')
  .get(birthdayController.getBirthdays)
  .post(birthdayController.addBirthday)

router
  .route('/:id')
  .get(birthdayController.getBirthday)
  .patch(birthdayController.updateBirthday)
  .delete(birthdayController.deleteBirthday)

module.exports = router
