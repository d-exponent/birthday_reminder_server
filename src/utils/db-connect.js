const mongoose = require('mongoose')
const enviroment = require('../settings/env')
const { MONGO_DB_CONNECTION } = require('../settings/constants')

module.exports = async (env = enviroment) => {
  if (MONGO_DB_CONNECTION.isActive === false) {
    try {
      await mongoose.connect(env.getMongoDbUri())
      MONGO_DB_CONNECTION.isActive = true
      return MONGO_DB_CONNECTION.connectSuccessMessage
    } catch (error) {
      return Promise.reject(error)
    }
  }
  return MONGO_DB_CONNECTION.isActiveMessage
}
