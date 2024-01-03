const connectDatabase = require('../lib/db-connect')
const Birthday = require('../models/birthday')
const { page: PAGE } = require('../settings/env')

module.exports = async function* birthdaysGenerator(day, month) {
  try {
    await connectDatabase()
    let skip = 0

    while (true) {
      const birthdays = await Birthday.find({ day, month })
        .skip(skip)
        .limit(PAGE)
        .populate({
          path: 'owner',
          select: 'isActive isVerified name email phone'
        })

      if (birthdays.length === 0) break

      yield birthdays
      skip += PAGE
    }
  } catch (e) {
    const title = e.name === 'MongooseError' ? 'MongooseError' : 'Unkown'
    console.error(title, '\n', `🛑REASON: ${e.message}`)
  }
}
