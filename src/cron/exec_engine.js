const Email = require('../features/email')
const commitError = require('../lib/commit-error')
const { isProduction } = require('../settings/env')
const { daysToMilliseconds } = require('../lib/utils')
const { BirthdayReminderJobError, EmailError } = require('../lib/custom-errors')

const birthdaysGenerator = require('./generator')

/**
 * @param { 1 | 7 } day defaults to zero (0)
 */
module.exports = async (day = 0) => {
  const date = new Date(Date.now() + daysToMilliseconds(day))
  const generatorObject = birthdaysGenerator(date.getDate(), date.getMonth() + 1)

  for await (const birthdays of generatorObject) {
    birthdays.forEach(({ owner, name, phone, email, _id }) => {
      if (!(owner.isActive && owner.isVerified)) return

      new Email(owner.name, owner.email)
        .sendBirthdayReminder({ name, phone, email, daysDue: day })
        .catch(e => {
          const message = `Owner id: ${owner['_id']} Birthday id: ${_id}`
          commitError(new BirthdayReminderJobError(message)).catch(console.error)
          if (isProduction) commitError(new EmailError(e.message)).catch(console.error)
        })

      // TODO: Execute whatsApp and Text Message Reminders depending on user subscription plan (NOT IMPLEMENTED YET)
    })
  }
}
