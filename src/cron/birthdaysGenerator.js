/* eslint-disable no-console */
/* eslint-disable no-await-in-loop */

const connectDatabase = require('../lib/db-connect')
const Birthday = require('../models/birthday')
const PAGE = require('../settings/env').page

const POPULATE_OPTIONS = {
  path: 'owner',
  select: 'isActive isVerified name email phone'
}

const logError = (title, reason) =>
  console.log(`🛑TITLE: ${title.toUpperCase()}`, '\n', `🛑REASON: ${reason}`)

module.exports = async function* birthdaysGenerator(day, month) {
  try {
    await connectDatabase()
    let skip = 0

    while (true) {
      const birthdays = await Birthday.find({ day, month })
        .populate(POPULATE_OPTIONS)
        .skip(skip)
        .limit(PAGE)

      if (birthdays.length === 0) break
      yield birthdays
      skip += PAGE
    }
  } catch (e) {
    logError(e.name === 'MongooseError' ? 'MongooseError' : 'Unkown', e.message)
  }
}
