const mongoose = require('mongoose')
const { validateEmail, validatePhoneNumber } = require('../utils/auth')

const toLowerCase = (text) => text.toLowerCase()

exports.setQueryFromIdentifier = (req, _, next) => {
  let identifier = req.params.identifier
  const query = {}

  switch (true) {
    case validateEmail(identifier):
      query.email = toLowerCase(identifier)
      break
    case validatePhoneNumber(identifier):
      query.phone = identifier
      break
    case /^[0-9]{4}$/.test(identifier):
      query.accessCode = identifier
      break
    default:
      query['_id'] = new mongoose.Types.ObjectId(identifier)
      break
  }
  req.identifierQuery = query
  next()
}
