exports.HTTP_STATUS_CODES = {
  success: {
    ok: 200,
    created: 201,
    noContent: 2014
  },
  error: {
    unauthorized: 401,
    notFound: 404,
    forbidden: 403,
    badRequest: 400,
    methodNotAllowed: 405,
    serverError: 500
  }
}

exports.RESPONSE_TYPE = {
  success: 'success',
  error: 'error'
}

exports.SCHEMA_OPTIONS = { toJSON: { virtuals: true } }

exports.USER_ROLES = ['user', 'admin']

exports.REGEX = {
  accessCode: /^[0-9]{4}$/,
  phone: /^\+(?:[0-9] ?){6,14}[0-9]$/,
  jwtToken: /^[A-Za-z0-9_-]{2,}(?:\.[A-Za-z0-9_-]{2,}){2}$/,
  bearerJwtToken: /^Bearer [A-Za-z0-9_-]{2,}(?:\.[A-Za-z0-9_-]{2,}){2}$/,
  mondoDbObjectId: /^[a-f\d]{24}$/,
  email:
    /(?:[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*|"(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21\x23-\x5b\x5d-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])*")@(?:(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?|\[(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?|[a-z0-9-]*[a-z0-9]:(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21-\x5a\x53-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])+)\])/gi
}
