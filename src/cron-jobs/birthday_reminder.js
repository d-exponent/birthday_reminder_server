const cron = require('node-cron')
const connectDatabase = require('../utils/db-connect')
const Birthdays = require('../models/birthday')
const Email = require('../features/email')
const commitError = require('../utils/commit-error')
const env = require('../settings/env')

const todaysDate = () => new Date()
const POPULATE_OPTIONS = {
  path: 'owner',
  select: 'isActive isVerified name email phone'
}

module.exports = cron.schedule(
  env.isProduction ? '0 0 */6 * * *' : '0 */20 * * * *',
  async () => {
    console.log(`Scheduled Birthday Reminder started at: ${today}`)

    const page = env.page || 100
    const today = todaysDate()
    const [day, month] = [today.getDate(), today.getMonth() + 1]

    let skip = 0
    const retryCount = 0

    while (true) {
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
                e.name = 'BirtdayReminderJobError'
                e.message = `Couldn't send ${owner.name} an email of ${name}'s birthday`
                commitError(e).catch(e => console.error(e, `At: ${today}`))
              })
          }
        })
        skip += page
      } catch (e) {
        e.name = 'BirtdayReminderJobError'
        commitError(e).catch(e => console.error(e))
        if (retryCount === 5) break
        retryCount++
      }
    }
  }
)
