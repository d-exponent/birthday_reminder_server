const cron = require('node-cron')
const BirthDay = require('../models/birthday')
const Email = require('./email')

async function* generateTodaysBirthdays() {
  let skip = 0
  const currentDate = new Date()
  const [currentMonth, currentDay] = [currentDate.getMonth() + 1, currentDate.getDate()]

  const birthdays = await BirthDay.find({ day: currentDay, month: currentMonth })
    .skip(skip)
    .limit(1)
    .populate({ path: 'owner', select: 'email name' })
    .exec()

  if (birthdays.length) {
    skip += 1
    yield birthdays[0]
  } else {
    yield null
  }
}

cron.schedule('* 6,12,18,21 * * *', async () => {
  let birthdays = generateTodaysBirthdays()
  for await (let birthday of birthdays) {
    if (!birthday) break

    try {
      await new Email(birthday.owner.name, birthday.owner.email).sendBirthdayRemind({
        name: birthday.name,
        email: birthday.email || '',
        phone: birthday.phone || ''
      })
    } catch (e) {
      console.error('🛑 BDAY REMIND ERROR: ', e)
    }
  }
})
