const mongoose = require('mongoose')
const enviroment = require('../settings/env')
const { MONGO_DB_CONNECTION: connection } = require('../settings/constants')

module.exports = async (env = enviroment) => {
  if (!connection.isActive) {
    try {
      const uri = `mongodb+srv://${env.dbUsername}:${env.dbPassword}@cluster0.ntzames.mongodb.net/${env.db}?retryWrites=true&w=majority`
      const db_connection = await mongoose.connect(uri)
      connection.isActive = db_connection.connections[0].readyState === 1
      return 'Connected to mongoDb successfully👍'
    } catch (error) {
      connection.isActive = false
      return Promise.reject(error.message)
    }
  }
  return '🤖 Connection is already active'
}
