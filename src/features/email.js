const nodemailer = require('nodemailer')
const { convertDaysToMilliseconds } = require('../cron/utils')
const env = require('../settings/env')

/**
 *
 * @param {string | undefined} param
 * @param {string} message
 * @returns {string} message : param if param is true else empty string
 */
const concatenateIfExist = (param, message) => (param ? `${message}: ${param}` : '')

/**
 * @param {number} days - Defaults to zero (0)
 * @returns formatted date e.g => Thursday, December 14
 */
const getFormattedDate = (days = 0) => {
  const totalMilliSeconds = Date.now() + convertDaysToMilliseconds(days)

  return new Date(totalMilliSeconds).toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric'
  })
}

/**
 *
 * @param { 1| 7 | 14 | 30 } daysDue - defaults to zero (today)
 * @returns "tomorrow" | "one week" | "two weeks" | "one month" | "today"
 */
const getDueDateDescription = daysDue => {
  const descriptions = {
    1: 'tomorrow',
    7: 'one week',
    14: 'two weeks',
    30: 'one month'
  }
  return descriptions[daysDue] ?? 'today'
}

const createTransport = email => {
  const prodConfig = {
    service: env.appEmailService,
    auth: { user: email, pass: env.appEmailPass }
  }

  const devConfig = {
    host: env.devEmailHost,
    port: env.devEmailPort,
    auth: { user: env.devEmailUser, pass: env.devEmailPassword }
  }

  return nodemailer.createTransport(env.isProduction ? prodConfig : devConfig)
}

module.exports = class Email {
  /**
   *
   * @param {string} userName
   * @param {string} userEmail
   */
  constructor(userName, userEmail) {
    this.userName = userName
    this.userEmail = userEmail
  }

  async #sendEmail(params) {
    const { appEmail } = env
    await createTransport(appEmail).sendMail({
      from: `Eclipse Reminder <${appEmail}>`,
      to: this.userEmail,
      text: params.text,
      subject: params.subject
    })
  }

  /**
   * Sends a welcome message to a user
   */
  async sendWelcome() {
    await this.#sendEmail({
      subject: 'Welcome to the Eclipse Birthday Reminder Family 🤗',
      text: `
      Welcome ${this.userName}, your account has been verified 🎉✨.

      We look forward to helping you keep track of the birtdays of those special to you.
      NEVER FORGET A BIRTHDAY EVER AGAIN

      Regards,
      Eclipse Birthday Reminder
      `
    })
  }

  /**
   * Sends the access code to the user's email address
   * @param { number } accessCode
   */
  async sendAccessCode(accessCode) {
    await this.#sendEmail({
      subject: `${this.userName} your one time verification code!`,
      text: `
      Hi ${this.userName}!
      
      Your login access code is
      ${accessCode}

      It expires in 10 minutes.

      Regards,
      Eclipse Birthday Reminder
      `
    })
  }

  /**
   * Sends custom birthday reminder message to user
   * @param { 0 | 1 | 7 | 14 | 30 } days
   * @param {{ name: string; phone: string; email: string }} details
   */
  async sendBirthdayReminder(days, { name, phone, email }) {
    await this.#sendEmail({
      subject: `BIRTHDAY ALERT FOR ${this.userName}  `,

      text: `
      It's ${name}'s birthday ${getDueDateDescription(days)}.

      Birthday Date: ${getFormattedDate(days)}

      ${phone || email ? "Celebrant's Details" : ''}
      ${concatenateIfExist(phone, 'Phone Number')}
      ${concatenateIfExist(email, 'Email Address')}

      Regards,
      Eclipse Birthday Reminder
      `
    })
  }
}
