const nodemailer = require('nodemailer')
const env = require('../settings/env')

class Email {
  appEmail = env.appEmail

  constructor(userName, userEmail, url = '') {
    this.userName = userName
    this.userEmail = userEmail
    this.url = url
  }

  transport() {
    return nodemailer.createTransport({
      service: 'hotmail',
      auth: {
        user: this.appEmail,
        pass: env.appEmailPass
      }
    })
  }

  async send(params) {
    await this.transport().sendMail({
      from: 'Eclipse Birthday Reminder',
      to: this.userEmail,
      text: params.text,
      subject: params.subject
    })
  }

  async sendAccessCode(accessCode) {
    await this.send({
      subject: `${this.userName} your one time verification code!`,
      text: `
      Hi ${this.userName}!
      
      Your authorization code is
      ${accessCode}

      it expires in 10 minutes.

      Regards,
      Eclipse Birthday Reminder
      `
    })
  }

  async sendBirthdayRemind({ name, phone, email }) {
    await this.send({
      subject: `BIRTHDAY ALERT FOR ${this.userName}  `,
      text: `
      It's ${name}'s birthday today.

      This is a reminder to wish them a happy birthday

      ${phone ? `${name}'s Phone Number: ``${phone}` : ''}
      ${email ? `${name}'s Email Address: ``${email}` : ''}

      Regards,
      Eclipse Birthday Reminder
      `
    })
  }
}

module.exports = Email
