const mongoose = require('mongoose')
const enviroment = require('../settings/env')
const { MONGO_DB_CONNECTION } = require('../settings/constants')

module.exports = async (env = enviroment) => {
  if (MONGO_DB_CONNECTION.isActive === false) {
    try {
      const db_connection = await mongoose.connect(env.getMongoDbUri())
      MONGO_DB_CONNECTION.isActive = db_connection.connections[0].readyState === 1
      return 'Connected to mongoDb successfully👍'
    } catch (error) {
      MONGO_DB_CONNECTION.isActive = false
      return Promise.reject(error.message)
    }
  }
  return '🤖 Connection is already active'
}
