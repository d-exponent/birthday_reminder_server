const cron = require('node-cron')
const mongoose = require('mongoose')

const env = require('./src/settings/env')
const { MONGO_DB_URL } = require('./src/settings/constants')
const birthdayReminderJob = require('./src/features/send-reminder')
const { productionServer, developmentServer } = require('./src/settings/servers')

mongoose
  .connect(MONGO_DB_URL, { autoIndex: !env.isProduction })
  .then(() => {
    console.log('👍 Connected to MongoDb successfully')

    // Application server
    env.isProduction ? productionServer() : developmentServer()

    // Scheduled Job
    // const cronExpression = env.isProduction ? '0 0 */6 * * *' : '0 */1 * * * *'
    // cron.schedule(cronExpression, birthdayReminderJob).start()
    console.log('👍 Birtday Reminder Job started successfully')
  })
  .catch((e) => console.error('🛑🛑 SERVER ERROR', e))
