/* eslint-disable lines-between-class-members */
/* eslint-disable no-console */
const fs = require('fs')
const path = require('path')
const AppError = require('./app-error')
const { STATUS, BIRTHDAYS_IMAGES_DIR_UNRESOLVED } = require('../settings/constants')
const { isVercel } = require('../settings/env')

const BIRTHDAYS_IMAGES_DIR = path.join('src', 'assets', 'images', 'birthdays')

class FirstRequestManager {
  isFirstRequest = true
  hasLoggedDbConnect = false
  hasCreatedImagesDir = false


  logDbConnect(msg) {
    if (!this.isFirstRequest) return
    console.log(msg)
    this.hasLoggedDbConnect = true
  }

  async prepImagesDir(_, __, next) {
    if (isVercel) {
      /**
       * Vercel seems to have restricted permissions to creating dynamic directoires.
       * Ensure the directories src/assets/images/birthdays  are already in fs before vercel deployment.
       */
      this.hasCreatedImagesDir = true
      return next()
    }

    // This implementation will be handy when we have a robust deployment to an Ubuntu instance
    if (!this.isFirstRequest) return next()

    if (fs.existsSync(BIRTHDAYS_IMAGES_DIR_UNRESOLVED)) {
      this.hasCreatedImagesDir = true
      return next()
    }

    try {
      await fs.promises.mkdir(BIRTHDAYS_IMAGES_DIR_UNRESOLVED, { recursive: true })
      this.hasCreatedImagesDir = true
    } catch (e) {
      return next(new AppError(e.message, STATUS.error.serverError))
    }
    return next()
  }

  setIsFirstRequest(_, __, next) {
    if (this.isFirstRequest)
      this.isFirstRequest = !(this.hasCreatedImagesDir && this.hasLoggedDbConnect)
    return next()
  }
}

module.exports = new FirstRequestManager()
module.exports.birthdayImagesDirectory = BIRTHDAYS_IMAGES_DIR
