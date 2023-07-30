const mongoose = require('mongoose')
const env = require('./src/settings/env')
const port = env.port
const app = require('./src/app')()

const server = app.listen(port, () =>
  console.log(`🤖[SERVER] is running on port`, port)
)

module.exports = app

// require('./src/cron-jobs/birthday_reminder').start()

const shutDownGracefully = (code = 1) => {
  return (err, reason) => {
    console.error('🛑🛑 SERVER ERROR =>  ', err, '🛑REASON => ', reason)
    server.close()
    mongoose.connection.close()
    console.error('All connections closed successfully')
    process.exit(code)
  }
}

process
  .on('SIGTERM', shutDownGracefully(0))
  .on('uncaughtException', shutDownGracefully())
  .on('unhandledRejection', shutDownGracefully())
