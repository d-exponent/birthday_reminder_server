const connectDatabase = require('./db-connect')
const ErrorModel = require('../models/error')

module.exports = async error => {
  const others = { ...error }
  const othersExclude = ['name', 'message', 'stack', 'status']
  othersExclude.forEach(el => delete others[el])

  const e = {
    name: error.name,
    status: error.status || undefined,
    message: error.message,
    stack: error.stack?.split('\n'),
    others: others || undefined
  }

  try {
    // Will not establish q new connection if one already exists
    await connectDatabase()
    return await ErrorModel.create(e)
  } catch (err) {
    err.cause = e
    return Promise.reject(err)
  }
}
