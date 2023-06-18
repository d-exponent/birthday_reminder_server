require('dotenv/config');

module.exports = () => {
  return {
    jwtSecret: process.env.JWT_SECRET,
    jwt_expires: process.env.JWT_EXPIRES_IN,
    dbPassword: process.env.DB_PASSWORD,
    dbUsername: process.env.DB_USERNAME,
    db: process.env.DB,
    nodeEnv: process.env.NODE_ENV,
    appEmail: process.env.APP_EMAIL,
    appEmailPass: process.env.EMAIL_PASSWORD,
    port: process.env.PORT || 5000,
  };
};
