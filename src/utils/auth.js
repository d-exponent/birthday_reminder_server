const env = require('../env')();
const jwt = require('jsonwebtoken');

exports.generateAccessCode = () => {
  return new Array(4)
    .fill(0)
    .map((num) => generateRandomNumber())
    .join('');
};

exports.getTimeIn = (minutes = 0) => new Date(Date.now() + minutes * 60000);

exports.validateEmail = (email) => {
  const rfc5322StandardEmailRegex =
    /(?:[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*|"(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21\x23-\x5b\x5d-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])*")@(?:(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?|\[(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?|[a-z0-9-]*[a-z0-9]:(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21-\x5a\x53-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])+)\])/g;

  return rfc5322StandardEmailRegex.test(email);
};

exports.validatePhoneNumber = (phoneNumber) => {
  const phoneNumberReg = /^\+(?:[0-9] ?){6,14}[0-9]$/;
  return phoneNumberReg.test(phoneNumber);
};

function generateRandomNumber() {
  return Math.round(Math.random() * 9);
}

exports.signRefreshToken = (email) => {
  return jwt.sign({ email }, env.refreshTokenSecret, {
    expiresIn: env.refreshTokenExpires,
  });
};

const ACCESS_TOKEN_EXPIRES = Number(env.accessTokenExpires);

exports.accessTokenCookieManager = (res, email) => {
  const token = jwt.sign({ email }, env.accessTokenSecret, {
    expiresIn: ACCESS_TOKEN_EXPIRES,
  });

  res.cookie('jwt', token, {
    maxAge: ACCESS_TOKEN_EXPIRES * 1000,
    secure: env.nodeEnv === 'production',
  });

  return token;
};
