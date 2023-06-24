const { purifyDoc } = require('../utils/contollers')
const Birthdays = require('../models/birthday')
const Email = require('./email')
const env = require('../settings/env')

let error_msg
const todaysBirthdaysGenerator = async function* () {
  const currentDate = new Date()
  const query = {
    day: currentDate.getDate(),
    month: currentDate.getMonth() + 1
  }

  const page = 2000
  let skip = 0

  while (true) {
    try {
      yield await Birthdays.find(query).skip(skip).limit(page)
      skip += page
    } catch (e) {
      error_msg = `🛑BDAY Generator Error\nDATE: ${currentDate}\nAT SKIP: ${skip}\n🛑Error:${e}`
      console.error(error_msg)

      yield []
    }
  }
}

module.exports = async () => {
  const generator = todaysBirthdaysGenerator()

  for await (const birthdays of generator) {
    if (!birthdays.length) {
      generator.return()
      break
    }

    birthdays.forEach((birthday) => {
      const { owner, name, phone, email } = purifyDoc(birthday)

      new Email(owner.name, env.isProduction ? owner.email : env.appEmail)
        .sendBirthdayReminder({
          name: name,
          phone: phone || '',
          email: email || ''
        })
        .catch((e) => {
          error_msg = `🛑 EMAIL ERROR: Couldn't send ${owner.email} an email of ${name}'s birthday => `
          console.error(error_msg, e.message)
        })
    })
  }
}
