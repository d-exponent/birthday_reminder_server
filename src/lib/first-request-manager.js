/* eslint-disable lines-between-class-members */
/* eslint-disable no-console */
const fs = require('fs')
const path = require('path')
const AppError = require('./app-error')
const { STATUS, BIRTHDAYS_IMAGES_DIR_UNRESOLVED } = require('../settings/constants')

const BIRTHDAYS_IMAGES_DIR = path.join('src', 'assets', 'images', 'birthdays')

module.exports = class FirstRequestManager {
  static isFirstRequest = true
  static hasLoggedDbConnect = false
  static hasCreatedImagesDir = false

  static logDbConnect(msg) {
    if (!this.isFirstRequest) return

    console.log(msg)
    this.hasLoggedDbConnect = true
    this.setFirstRequest()
  }

  static async prepImagesDir(_, __, next) {
    if (!this.isFirstRequest) return next()

    if (!fs.existsSync(BIRTHDAYS_IMAGES_DIR_UNRESOLVED)) {
      try {
        await fs.promises.mkdir(BIRTHDAYS_IMAGES_DIR_UNRESOLVED, { recursive: true })
      } catch (e) {
        return next(new AppError(e.message, STATUS.error.serverError))
      }
    }

    this.hasCreatedImagesDir = true
    this.setFirstRequest()
    return next()
  }

  static setFirstRequest() {
    if (this.isFirstRequest)
      this.isFirstRequest = !(this.hasCreatedImagesDir && this.hasLoggedDbConnect)
  }
}

module.exports.birthdayImagesDirectory = BIRTHDAYS_IMAGES_DIR
