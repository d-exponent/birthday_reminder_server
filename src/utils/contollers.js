const { HTTP_STATUS_CODES } = require('../settings/constants')

exports.sendResponse = (type, res, params) => {
  const response = { ...params }

  if (type.match(/error/i)) {
    response.status = params.status || HTTP_STATUS_CODES.error.serverError
    response.success = false
  } else if (type.match(/success/i)) {
    response.status = params.status || HTTP_STATUS_CODES.success.ok
    response.success = true
  } else {
    const err = new Error('type parameter must be either error or success')
    err.name = 'ValueError'
    throw err
  }

  res.status(response.status).json({ ...response, status: undefined })
}

exports.baseSelect = (...args) => {
  let selected = 'name email phone'

  if (args) {
    args.forEach((arg) => (selected = `${selected} ${arg}`))
  }

  return selected
}
