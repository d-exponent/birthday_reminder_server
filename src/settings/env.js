require('dotenv/config')

const env = process.env

module.exports = {
  // App server settings
  nodeEnv: env.NODE_ENV,
  port: env.PORT || 5000,
  isProduction: env.NODE_ENV === 'production',
  devHttpProtocol: env.DEV_HTTP_PROTOCOL || 'http',

  // Database
  db: env.DB,
  dbPassword: env.DB_PASSWORD,
  dbUsername: env.DB_USERNAME,

  // For Nodemailer (PROD)
  appEmail: env.APP_EMAIL,
  appEmailPass: env.EMAIL_PASSWORD,
  appEmailService: env.APP_EMAIL_SERVICE,

  // For Nodemailer (DEV)
  devEmailHost: env.DEV_EMAIL_HOST,
  devEmailUser: env.DEV_EMAIL_USER,
  devEmailPassword: env.DEV_EMAIL_PASS,
  devEmailPort: Number(env.DEV_EMAIL_PORT),

  // Auth
  cookieName: env.COOKIE_NAME,
  cookieSecret: env.COOKIE_SECRET,
  accessTokenSecret: env.ACCESS_TOKEN_SECRET,
  refreshTokenSecret: env.REFRESH_TOKEN_SECRET,
  refreshTokenExpires: Number(env.REFRESH_TOKEN_EXPIRES),
  accessTokenExpires: Number(env.ACCESS_TOKEN_EXPIRES)
}
