/* eslint-disable lines-between-class-members */
/* eslint-disable no-console */
const fs = require('fs')
const AppError = require('./app-error')
const { STATUS, BIRTHDAYS_IMAGES_DIR } = require('../settings/constants')

class FirstRequestManager {
  isFirstRequest = true
  hasLoggedDbConnect = false
  hasCreatedImagesDir = false

  logDbConnect(msg) {
    if (!this.isFirstRequest) return

    if (msg.message) {
      console.error(msg.message)
    } else {
      console.log(msg)
    }
    this.hasLoggedDbConnect = true
  }

  async prepImagesDir(_, __, next) {
    if (!this.isFirstRequest) return next()

    // This check is a time consuming blocking operation. Only done when absolutely neccessary
    if (fs.existsSync(BIRTHDAYS_IMAGES_DIR)) return next()

    try {
      await fs.promises.mkdir(BIRTHDAYS_IMAGES_DIR, { recursive: true })
    } catch (e) {
      return next(
        new AppError(
          e.message ?? 'Something went wrong with prepping images directory',
          STATUS.error.serverError
        )
      )
    }
    this.hasCreatedImagesDir = true
    return next()
  }

  setIsFirstRequest(_, __, next) {
    this.isFirstRequest = !(this.hasCreatedImagesDir && this.hasLoggedDbConnect)
    return next()
  }
}

module.exports = new FirstRequestManager()
