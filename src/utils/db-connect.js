const { connect } = require('mongoose')
const { MONGO_DB_URI, STATUS } = require('../settings/constants')
const AppError = require('./app-error')

const connection = {}

module.exports = async () => {
  if (!connection.isConnected) {
    try {
      const db_connection = await connect(MONGO_DB_URI)
      connection.isConnected = db_connection.connections[0].readyState === 1
      return 'Connected to mongoDb successfully👍'
    } catch (error) {
      connection.isConnected = false
      return Promise.reject(error)
    }
  }
  return ' 🤖 Connection is active'
}
