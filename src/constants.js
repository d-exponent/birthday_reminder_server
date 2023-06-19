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
