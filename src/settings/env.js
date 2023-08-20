require('dotenv/config')

const { env } = process

module.exports = {
  // for birthday reminder job
  page: env.PAGE ? Number(env.page) : undefined,

  // App server settings
  nodeEnv: env.NODE_ENV,
  port: env.PORT,

  // Database
  db: env.DB,
  dbPassword: env.DB_PASSWORD,
  dbUsername: env.DB_USERNAME,

  // 'fOo.bAr, foo.b ar, foobar' => ['foo.bar', 'foo.bar', 'foobar']
  allowedOrigins: env.ALLOWED_ORIGINS?.replaceAll(' ', '')
    .toLowerCase()
    .split(','),

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

  isVercel: env.DEPLOYMENT === 'vercel',

  get mongoDBUri() {
    return `mongodb+srv://${this.dbUsername}:${this.dbPassword}@cluster0.ntzames.mongodb.net/${this.db}?retryWrites=true&w=majority`
  },

  get isProduction() {
    return this.nodeEnv === 'production'
  },

  get accessTokenExpires() {
    /**
     * PROBLEM:
     * Client and server domains are decoupled creating issues with cookie authentication
     * Cookie can only be shared cross-domian over https via sameSite:"None" secure. (CORS) -> allowed-origin: client-domain.com
     * This makes it impossible to share cross domain cookies in Developement on localhost in the browser
     * CURRENT SOLUTION:
     * Make the access token long live in developemnt and ditch cookie startegy
     * Commence cookie strategy on client and server over https (deployment)
     */
    return this.isProduction
      ? Number(env.ACCESS_TOKEN_EXPIRES)
      : Number(env.ACCESS_TOKEN_EXPIRES) * 100
  }
}
