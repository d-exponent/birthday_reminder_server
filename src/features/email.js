const nodemailer = require('nodemailer')
const env = require('../settings/env')

module.exports = class Email {
  appEmail = env.appEmail

  constructor(userName, userEmail) {
    this.userName = userName
    this.userEmail = userEmail
  }

  transport() {
    const prodConfig = {
      service: env.appEmailService,
      auth: {
        user: this.appEmail,
        pass: env.appEmailPass
      }
    }

    const devConfig = {
      host: env.devEmailHost,
      port: env.devEmailPort,
      auth: {
        user: env.devEmailUser,
        pass: env.devEmailPassword
      }
    }

    return nodemailer.createTransport(env.isProduction ? prodConfig : devConfig)
  }

  async send(params) {
    await this.transport().sendMail({
      from: this.appEmail,
      to: this.userEmail,
      text: params.text,
      subject: params.subject
    })
  }

  async sendWelcome() {
    await this.send({
      subject: 'Welcome to the Eclipse Birthday Reminder Family 🤗',
      text: `

      Congratulations ${this.userName}🎉✨, your account has been verified.

      We look forward to helping you keep track of the birtdays of those special to you.
      NEVER FOR GET A BIRTHDAY AGAIN

      Regards,
      Eclipse Birthday Reminder
      `
    })
  }

  async sendAccessCode(accessCode) {
    await this.send({
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

  async sendBirthdayReminder({ name, phone, email }) {
    await this.send({
      subject: `BIRTHDAY ALERT FOR ${this.userName}  `,

      text: `
      It's ${name}'s birthday today.

      This is a reminder to wish them a happy birthday

      ${phone || email ? "Celebrant's Details : " : ''}
      ${phone ? 'Phone Number: ' + phone : ''}
      ${email ? 'Email Address: ' + email : ''}

      Regards,
      Eclipse Birthday Reminder
      `
    })
  }
}
