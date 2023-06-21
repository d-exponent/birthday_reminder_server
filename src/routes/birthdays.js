const router = require('express').Router()

const birthdayController = require('../controllers/birthday')
const authController = require('../controllers/auth')

router.use(authController.protect, authController.restrictTo('admin'))

router.get('/', birthdayController.getBirthdays)
router.get('/:ownerId', birthdayController.getBirthdaysForOwner)


module.exports = router
