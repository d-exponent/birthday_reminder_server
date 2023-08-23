const mongoose = require('mongoose')
const enviroment = require('../settings/env')
const { MONGO_DB_CONNECTION } = require('../settings/constants')

module.exports = async function connect(env = enviroment) {
  if (MONGO_DB_CONNECTION.isActive) return MONGO_DB_CONNECTION.isActiveMessage

  try {
    await mongoose.connect(env.mongoDBUri)
    MONGO_DB_CONNECTION.isActive = true
    return MONGO_DB_CONNECTION.connectSuccessMessage
  } catch (e) {
    return Promise.reject(e)
  }
}

const logOnFirstRequest = () => {
  let isFirstRequest = true

  return msg => {
    if (!isFirstRequest) return
    // eslint-disable-next-line no-unused-expressions
    msg.message ? console.error(msg.message) : console.log(msg)
    isFirstRequest = false
  }
}

module.exports.logOnFirstRequest = logOnFirstRequest()
