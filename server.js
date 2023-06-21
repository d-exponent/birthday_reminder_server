const mongoose = require('mongoose')

const env = require('./src/settings/env')
const { productionServer, developmentServer } = require('./src/settings/servers')

mongoose
  .connect(
    `mongodb+srv://${env.dbUsername}:${env.dbPassword}@cluster0.ntzames.mongodb.net/${env.db}?retryWrites=true&w=majority`
  )
  .then(() => (env.isProduction ? productionServer() : developmentServer()))
  .catch((e) => console.error('🛑🛑 Mongoose COnnection Error', e))

// process.on('uncaughtException', (e) => {
//   console.error('🛑🛑 UNCAUGHT_EXCEPTION', e)
//   process.exit(1)
// })

// process.on('unhandledRejection', (e) => {
//   console.error('🛑🛑 UNHANDLED REJECTION', e)
//   process.exit(1)
// })
