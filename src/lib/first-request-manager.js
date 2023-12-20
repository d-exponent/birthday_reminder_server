const fs = require('fs')

const {
  STATUS,
  BIRTHDAYS_IMAGES_DIR,
  USERS_IMAGES_DIR
} = require('../settings/constants')
const AppError = require('./app-error')

module.exports = class FirstRequestManager {
  static hasLoggedDbConnect = false

  static hasCreatedImagesDir = false

  static logDbConnect(msg) {
    if (this.hasLoggedDbConnect) return

    console.log(msg)
    this.hasLoggedDbConnect = true
  }

  static async prepImagesDir(_, __, next) {
    if (this.hasCreatedImagesDir) return next()

    try {
      const result = await Promise.allSettled([
        fs.promises.mkdir(BIRTHDAYS_IMAGES_DIR, { recursive: true }),
        fs.promises.mkdir(USERS_IMAGES_DIR, { recursive: true })
      ])
      this.hasCreatedImagesDir = result.every(r => r.status === 'fulfilled')
    } catch (e) {
      return next(new AppError(e.message, STATUS.error.serverError))
    }
    return next()
  }
}

module.exports.birthdayImagesDirectory = BIRTHDAYS_IMAGES_DIR
