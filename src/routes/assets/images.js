const router = require('express').Router()

const { handleGetImage } = require('../../controllers/factory')

router.route('/birthdays/:imageName').get(handleGetImage('birthdays'))
router.route('/users/:imageName').get(handleGetImage('users'))

module.exports = router
