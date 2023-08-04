const cron = require('node-cron')
const connectDatabase = require('../utils/db-connect')
const Birthdays = require('../models/birthday')
const Email = require('../features/email')
const commitError = require('../utils/commit-error')
const env = require('../settings/env')
const { BirthdayReminderJobError, EmailError } = require('../utils/custom-errors')

const todaysDate = () => new Date()
const POPULATE_OPTIONS = {
  path: 'owner',
  select: 'isActive isVerified name email phone'
}

let error

module.exports = cron.schedule(
  env.isProduction ? '0 0 */6 * * *' : '0 */20 * * * *',
  async () => {
    console.log(`Scheduled Birthday Reminder started at: ${today}`)

    const page = env.page || 100
    const today = todaysDate()
    const [day, month] = [today.getDate(), today.getMonth() + 1]

    let skip = 0
    const retryCount = 0

    while (retryCount < 3) {
      try {
        await connectDatabase()
        const birthdays = await Birthdays.find({ day, month })
          .populate(POPULATE_OPTIONS)
          .skip(skip)
          .limit(page)

        // There are no more birthdays for the day
        if (birthdays.length === 0) break

        birthdays.forEach(({ owner, name, phone, email }) => {
          if (owner.isActive && owner.isVerified) {
            new Email(owner.name, owner.email)
              .sendBirthdayReminder({ name, phone, email })
              .catch(e => {
                error = new EmailError(e.message)
                commitError(error).catch(e => console.error(e))

                error = new BirthdayReminderJobError(
                  `Couldn't send ${owner.name} an email of ${name}'s birthday`
                )
                commitError(error).catch(e => console.error(e))
              })
          }
        })
        skip += page
      } catch (e) {
        error = new BirthdayReminderJobError(e.message)
        commitError(error).catch(e => console.error(e))
        retryCount++
      }
    }
  }
)
