const cron = require('node-cron')

const connectDatabase = require('../utils/db-connect')
const Birthdays = require('../models/birthday')
const Email = require('../features/email')
const env = require('../settings/env')

const todaysDate = () => new Date()

const cronExpression = env.isProduction ? '0 0 */6 * * *' : '0 */20 * * * *'

module.exports = cron.schedule(cronExpression, async () => {
  console.log(`Scheduled Birthday Reminder started at: ${today}`)
  const today = todaysDate()
  const query = {
    day: today.getDate(),
    month: today.getMonth() + 1
  }
  const populateOptions = {
    path: 'owner',
    select: 'isActive isVerified name email phone'
  }

  const page = env.page || 100
  let skip = 0
  while (true) {
    try {
      await connectDatabase()
      const birthdays = await Birthdays.find(query)
        .populate(populateOptions)
        .skip(skip)
        .limit(page)

      // There are no more birthdays for the day
      if (birthdays.length === 0) break

      birthdays.forEach(({ owner, name, phone, email }) => {
        // Perform for Only valid users
        if (owner.isActive && owner.isVerified) {
          new Email(owner.name, owner.email)
            .sendBirthdayReminder({ name, phone, email })
            .catch(e => {
              const error_msg = `🛑 EMAIL ERROR: Couldn't send ${owner.name} an email of ${name}'s birthday => `
              console.error(error_msg, e.message)
            })

          // TODO: Send whatsapp messages
          // TODO: Send text messages
          // Perhaps make calls ??
        }
      })

      skip += page
    } catch (e) {
      // TODO: Send admin an email or a text or something
      console.error(`🛑 Bday Reminder Job error at ${today}`, e)
      break
    }
  }
})
