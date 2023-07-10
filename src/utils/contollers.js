const { STATUS } = require('../settings/constants')

const SELECTED_USER_FEILDS = 'name phone email id role'

exports.sendResponse = (type, res, body) => {
  if (type.match(/error/i)) {
    body.status = body.status || STATUS.error.serverError
    body.success = false
  } else if (type.match(/success/i)) {
    body.status = body.status || STATUS.success.ok
    body.success = true
  } else {
    const err = new Error('type parameter must be either error or success')
    err.name = 'ValueError'
    throw err
  }

  res.status(body.status).json({ ...body, status: undefined })
}

exports.baseSelect = (...args) => {
  let defaultSelected = SELECTED_USER_FEILDS
  args.length &&
    args.forEach(arg => (defaultSelected = `${defaultSelected} ${arg}`))
  return defaultSelected
}

exports.purifyDoc = doc => JSON.parse(JSON.stringify(doc))

exports.includeOnly = (doc, ...args) => {
  if (!args.length) {
    throw new Error('You must provide at least one value to include')
  }

  const filtered = {}

  if (args.length == 1) {
    args = args[0].split(' ')
  }

  args.forEach(arg => (args ? (filtered[arg] = doc[arg]) : ''))
  return filtered
}

exports.defaultSelectedUserValues = user => {
  return this.includeOnly(user, SELECTED_USER_FEILDS)
}
