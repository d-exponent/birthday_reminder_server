const mongoose = require('mongoose')

const { REGEX, HTTP_STATUS_CODES } = require('../settings/constants')
const AppError = require('../utils/appError')

exports.setMongooseFindParams = (req, _, next) => {
  let identifier
  let accessCode

  const query = {}
  const { params } = req

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
        return next(
          new AppError(
            `The url parameter ${identifier} on ${req.originalUrl} did not match any expected expression`,
            HTTP_STATUS_CODES.error.badRequest
          )
        )
    }
  }

  if (params.accessCode) {
    accessCode = params.accessCode
    switch (true) {
      case REGEX.accessCode.test(accessCode):
        query.accessCode = accessCode
        break

      default:
        return next(
          new AppError(
            `The access code ${accessCode} on ${req.originalUrl} is wrongly formatted!`,
            HTTP_STATUS_CODES.error.badRequest
          )
        )
    }
  }

  req.identifierQuery = query
  next()
}
