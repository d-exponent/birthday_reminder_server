const mongoose = require('mongoose')

const AppError = require('../utils/app-error')
const { REGEX, HTTP_STATUS_CODES } = require('../settings/constants')

let error_msg
exports.setCustomQueryFromParams = (req, _, next) => {
  const { params } = req
  req.customQuery = {}

  if (params['user_email_phone_id']) {
    paramsValue = params['user_email_phone_id']

    switch (true) {
      case REGEX.email.test(paramsValue):
        req.customQuery.email = paramsValue.toLowerCase()
        break
      case REGEX.phone.test(paramsValue):
        req.customQuery.phone = paramsValue
        break
      case REGEX.mondoDbObjectId.test(paramsValue):
        req.customQuery['_id'] = new mongoose.Types.ObjectId(paramsValue)
        break
      default:
        error_msg = `The url parameter ${paramsValue} on ${req.originalUrl} did not match any expected expression`
        return next(new AppError(error_msg, HTTP_STATUS_CODES.error.badRequest))
    }
  }

  next()
}

exports.validateAccessCodeAnatomy = ({ params: { accessCode } }, _, next) => {
  if (!REGEX.accessCode.test(accessCode)) {
    error_msg = `The access code ${accessCode} on ${req.originalUrl} is wrongly formatted!`
    return next(new AppError(error_msg, HTTP_STATUS_CODES.error.badRequest))
  }

  next()
}
