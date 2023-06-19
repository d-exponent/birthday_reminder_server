const mongoose = require('mongoose')

const app = require('./src/app')()
const env = require('./src/env')
const port = env.port

const dbConnectUrl = `mongodb+srv://${env.dbUsername}:${env.dbPassword}@cluster0.ntzames.mongodb.net/${env.db}?retryWrites=true&w=majority`

mongoose
  .connect(dbConnectUrl)
  .then(() => {
    app.listen(port, () => {
      console.log('🤖[SERVER] is running on port:', port)
    })
  })
  .catch((e) => {
    console.error('🛑🛑 Error', env.nodeEnv == 'development' ? e : e.message)
  })

process.on('uncaughtException', (e) => {
  console.error('🛑🛑 UNCAUGHT_EXCEPTION', e)
  process.exit(1)
})

process.on('unhandledRejection', (e) => {
  console.error('🛑🛑 UNHANDLED REJECTION', e)
  process.exit(1)
})
