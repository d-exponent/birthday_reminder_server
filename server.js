const cron = require('node-cron')
const mongoose = require('mongoose')

const env = require('./src/settings/env')
const birthdayReminderJob = require('./src/features/send-reminder')
const { MONGO_DB_URL } = require('./src/settings/constants')
const { productionServer, developmentServer } = require('./src/settings/servers')

const isProduction = env.isProduction
const cronExpression = isProduction ? '0 0 */6 * * *' : '0 */1 * * * *'

mongoose
  .connect(MONGO_DB_URL, { autoIndex: !isProduction })
  .then(() => {
    console.log('👍 Connected to MongoDb successfully')
    isProduction ? productionServer() : developmentServer()
    cron.schedule(cronExpression, birthdayReminderJob).start()
    console.log('👍 Birtday Reminder Job started successfully')
  })
  .catch((e) => console.error('🛑🛑 SERVER ERROR', e))
