require('dotenv/config');

module.exports = () => {
  return {
    accessTokenSecret: process.env.JWT_SECRET,
    accessTokenExpires: process.env.JWT_EXPIRES_IN,
    dbPassword: process.env.DB_PASSWORD,
    dbUsername: process.env.DB_USERNAME,
    db: process.env.DB,
    nodeEnv: process.env.NODE_ENV,
    appEmail: process.env.APP_EMAIL,
    appEmailPass: process.env.EMAIL_PASSWORD,
    port: process.env.PORT || 5000,
    refreshTokenSecret: process.env.REFRESH_TOKEN_SECRET,
    refreshTokenExpires: process.env.REFRES_TOKEN_EXPIRES,
  };
};
