const Email = require('../features/email')
const commitError = require('../lib/commit-error')
const { isProduction } = require('../settings/env')
const { daysToMilliseconds } = require('../lib/utils')
const { BirthdayReminderJobError, EmailError } = require('../lib/custom-errors')

const birthdaysGenerator = require('./generator')

const commit = (ErrorClass, message) =>
  commitError(new ErrorClass(message)).catch(e => console.error(e.message))

/**
 * @param { 1 | 7 } day defaults to zero (0)
 */
module.exports = async (days = 0) => {
  const date = new Date(Date.now() + daysToMilliseconds(days))
  const generatorObject = birthdaysGenerator(date.getDate(), date.getMonth() + 1)

  for await (const birthdays of generatorObject) {
    birthdays.forEach(async ({ owner, name, phone, email, _id }) => {
      // user deleted their profile or hasn't logged in at least once
      if (!(owner.isActive && owner.isVerified)) return

      try {
        await new Email(owner.name, owner.email).sendBirthdayReminder({
          name,
          phone,
          email,
          daysDue: days
        })
      } catch (e) {
        if (isProduction) commit(EmailError, e.message)
        commit(BirthdayReminderJobError, `Owner id: ${owner['_id']} Birthday id: ${_id}`)
      }

      // TODO: Execute whatsApp and Text Message Reminders depending on user subscription plan (NOT IMPLEMENTED YET)
    })
  }
}
