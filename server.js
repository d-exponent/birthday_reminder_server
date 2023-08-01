const mongoose = require('mongoose')
const connectDatabase = require('./src/utils/db-connect')
const env = require('./src/settings/env')
const reminderJob = require('./src/cron-jobs/birthday_reminder')
const port = env.port
const app = require('./src/app')()

// const server = app.listen(port, () =>
//   console.log(`🤖[SERVER] is running on port`, port)
// )

connectDatabase()
  .then(res => {
    console.log(res)
    reminderJob.start()
    app.listen(port, () => console.log(`🤖[SERVER] is running on port`, port))
  })
  .catch(error => console.error(error))

module.exports = app

// START CRON JOB

// const shutDownGracefully = (code = 1) => {
//   return (err, reason) => {
//     console.error('🛑🛑 SERVER ERROR =>  ', err, '🛑REASON => ', reason)
//     server.close()
//     mongoose.connection.close()
//     console.error('All connections closed successfully')
//     process.exit(code)
//   }
// }

// // Handle shutdown events
// process
//   .on('SIGTERM', shutDownGracefully(0))
//   .on('uncaughtException', shutDownGracefully())
//   .on('unhandledRejection', shutDownGracefully())
