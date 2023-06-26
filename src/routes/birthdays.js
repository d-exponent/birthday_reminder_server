const router = require('express').Router()

const birthdayController = require('../controllers/birthdays')
const authController = require('../controllers/auth')

router.use(authController.protect, authController.permit('admin'))

router.get('/', birthdayController.getBirthdays)
router.get('/:ownerId', birthdayController.getBirthdaysForOwner)

module.exports = router
