const nodemailer = require('nodemailer')
const env = require('../env')

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
      from: 'Eclipse Todo',
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
      Eclipse Todo Team
      `
    })
  }
}

module.exports = Email
