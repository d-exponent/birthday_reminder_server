const connectDatabase = require('./src/utils/db-connect')
const server = require('./src/server')

// Server starts birthday reminder Job
require('./src/cron-jobs/birthday_reminder').start()

connectDatabase()
  .then(res => {
    console.log(res)
    server()
  })
  .catch(e => console.error(e.message))
