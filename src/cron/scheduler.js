/* eslint-disable no-console */
const cron = require('node-cron')

const env = require('../settings/env')
const executeReminders = require('./exec_engine')

const cronExpression = !env.isProduction ? '52 * * * *' : '0 0 * * *'

module.exports = cron.schedule(cronExpression, async () => {
  console.log(`✔Birthday Reminder Job started at: ${new Date()}`)

  await Promise.all([
    executeReminders(), // Today
    executeReminders(1), // Tomorrow
    executeReminders(7) // one week
  ])

  console.log(`✔Birthday Reminder JOB ENDED at: ${new Date()}`)
})
