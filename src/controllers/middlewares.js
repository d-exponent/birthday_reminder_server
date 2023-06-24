const mongoose = require('mongoose')

const AppError = require('../utils/appError')
const { REGEX, HTTP_STATUS_CODES } = require('../settings/constants')

let error_msg
exports.setMongooseFindParams = (req, _, next) => {
  const query = {}
  const { params } = req

  let identifier
  let accessCode

  if (params.identifier) {
    identifier = params.identifier

    switch (true) {
      case REGEX.email.test(identifier):
        query.email = identifier.toLowerCase()
        break
      case REGEX.phone.test(identifier):
        query.phone = identifier
        break
      case REGEX.mondoDbObjectId.test(identifier):
        query['_id'] = new mongoose.Types.ObjectId(identifier)
        break
      default:
        error_msg = `The url parameter ${identifier} on ${req.originalUrl} did not match any expected expression`
        return next(new AppError(error_msg, HTTP_STATUS_CODES.error.badRequest))
    }
  }

  if (params.accessCode) {
    accessCode = params.accessCode
    switch (true) {
      case REGEX.accessCode.test(accessCode):
        query.accessCode = accessCode
        break

      default:
        error_msg = `The access code ${accessCode} on ${req.originalUrl} is wrongly formatted!`
        return next(new AppError(error_msg, HTTP_STATUS_CODES.error.badRequest))
    }
  }

  req.identifierQuery = query
  next()
}
