const mongoose = require('mongoose')

const enviroment = require('../settings/env')
const { MONGO_DB_CONNECTION } = require('../settings/constants')

/**
 * Connects to mongoDB if there is no active connection
 * @param {{databaseUri: string}} env
 * @returns connection message on success or error object on error
 */
module.exports = async (env = enviroment) => {
  if (MONGO_DB_CONNECTION.isActive) return MONGO_DB_CONNECTION.isActiveMessage

  try {
    await mongoose.connect(env.databaseUri)
    MONGO_DB_CONNECTION.isActive = true
    return MONGO_DB_CONNECTION.connectSuccessMessage
  } catch (e) {
    MONGO_DB_CONNECTION.isActive = false
    return Promise.reject(e.message)
  }
}
