const router = require('express').Router()

const usersRoutes = require('./users')
const birthdaysRoutes = require('./birthdays')
const assetsRoutes = require('./assets/assets')
const authRoutes = require('./auth')

router.use('/users', usersRoutes)
router.use('/birthdays', birthdaysRoutes)
router.use('/auth', authRoutes)
router.use('/assets', assetsRoutes)

module.exports = router
