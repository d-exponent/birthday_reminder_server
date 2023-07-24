const connectDatabase = require('./src/utils/db-connect')
const mongoose = require('mongoose')
const env = require('./src/settings/env')
const port = env.port
const app = require('./src/app')()

// Server starts birthday reminder Job
require('./src/cron-jobs/birthday_reminder').start()

connectDatabase()
  .then(res => console.log(res))
  .catch(e => console.error(e.message))

const server = app.listen(port, () =>
  console.log(`🤖[SERVER] is running on port`, port)
)

process
  .on('SIGTERM', shutDownGracefully('SIGTERM'))
  .on('uncaughtException', shutDownGracefully('uncaughtException', 1))
  .on('unhandledRejection', shutDownGracefully('unhandledRejection', 1))

function shutDownGracefully(event, code = 0) {
  return (err, reason) => {
    console.log('🛑 EVENT =>', event)
    console.error('🛑🛑 ERROR =>  ', err)
    console.error('🛑🛑 Source => ', reason)

    server.close()
    console.log('Server closed.')

    mongoose.connection.close()
    console.log('Mongoose connection closed.')
    process.exit(code)
  }
}
