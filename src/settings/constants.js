const path = require('path')

const assetsImagesDir = dir => path.join(__dirname, '..', 'assets', 'images', dir)

exports.STATUS = {
  success: {
    ok: 200,
    created: 201,
    noContent: 204
  },
  error: {
    unauthorized: 401,
    notFound: 404,
    forbidden: 403,
    badRequest: 400,
    methodNotAllowed: 405,
    badConnection: 502,
    gatewayTimeOut: 504,
    serverError: 500,
    notImplemeted: 501
  }
}

exports.DELETE_RESPONSE = {
  message: '',
  status: this.STATUS.success.noContent
}

exports.RESPONSE = {
  success: 'success',
  error: 'error'
}

exports.TOKENS = {
  refresh: 'refresh',
  access: 'access'
}

exports.SCHEMA_OPTIONS = { toJSON: { virtuals: true } }

exports.VALID_USER_ROLES = ['user', 'admin']

exports.REGEX = {
  accessCode: /^[0-9]{4,8}$/,
  phone: /^\+(?:[0-9] ?){6,16}[0-9]$/,
  jwtToken: /^[A-Za-z0-9_-]{2,}(?:\.[A-Za-z0-9_-]{2,}){2}$/,
  bearerJwtToken: /^Bearer [A-Za-z0-9_-]{2,}(?:\.[A-Za-z0-9_-]{2,}){2}$/,
  mondoDbObjectId: /^[a-f\d]{24}$/,
  email:
    // eslint-disable-next-line no-control-regex
    /(?:[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*|"(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21\x23-\x5b\x5d-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])*")@(?:(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?|\[(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?|[a-z0-9-]*[a-z0-9]:(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21-\x5a\x53-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])+)\])/
}

exports.BIRTHDAYS_IMAGES_DIR = assetsImagesDir('birthdays')

exports.USERS_IMAGES_DIR = assetsImagesDir('users')

exports.MONGO_DB_CONNECTION = {
  isActive: false,
  isActiveMessage: '🤖 Connection is already active',
  connectSuccessMessage: 'Connected to mongoDb successfully👍'
}

exports.CORS_ORIGIN_ERROR =
  'The CORS policy for this site does not allow access from the specified Origin.'

