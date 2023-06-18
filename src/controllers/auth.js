const User = require('../models/user');

const env = require('../env')();
const Email = require('../features/email');
const jwt = require('jsonwebtoken');
const catchAsync = require('../utils/catchAsync');
const {
  generateAccessCode,
  getTimeIn,
  signRefreshToken,
  accessTokenCookieManager,
} = require('../utils/auth');

const {
  sendSuccessResponse,
  sendFailureResponse,
  setFindParmasFromIdentifier,
} = require('../utils/contollers');

let DB_USER;

exports.requestAccessCode = catchAsync(
  async ({ params: { identifier } }, res) => {
    const params = setFindParmasFromIdentifier(identifier);

    if (!params) {
      DB_USER = await User.findById(identifier);
    } else {
      DB_USER = await User.findOne(params);
    }

    if (!DB_USER) {
      return sendFailureResponse(res, {
        status: 404,
        message: 'The user does not exist',
      });
    }

    DB_USER.accessCode = generateAccessCode();
    DB_USER.accessCodeExpires = getTimeIn((minutes = 10));
    DB_USER.verfied = false;
    const emailer = new Email(DB_USER.name, DB_USER.email);

    DB_USER.save()
      .then(async () => {
        try {
          sendSuccessResponse(res, {
            message: `An access code has been sent to ${DB_USER.email}. Expires in ten (10) minutes`,
          });
          await emailer.sendAccessCode(DB_USER.accessCode);
        } catch (e) {
          return e;
        }
      })
      .catch(() => {
        sendFailureResponse(res, {
          message: 'Something went wrong!',
        });
      });
  }
);

exports.login = catchAsync(async ({ params: { identifier } }, res) => {
  //
  DB_USER = await User.findOne({ accessCode: identifier });

  if (!DB_USER) {
    return sendFailureResponse(res, {
      status: 404,
      message: 'Inavlid credentials',
    });
  }

  if (Date.now() > DB_USER.accessCodeExpires.getTime()) {
    sendFailureResponse(res, {
      status: 401,
      message: 'Expired credentials.',
    });
    return;
  }

  const accessToken = accessTokenCookieManager(res, DB_USER.email);
  const refreshToken = signRefreshToken(DB_USER.email);

  DB_USER.accessCode = undefined;
  DB_USER.accessCodeExpires = undefined;
  DB_USER.verfied = true;
  DB_USER.refreshToken = refreshToken;

  try {
    await DB_USER.save();
    sendSuccessResponse(res, {
      data: {
        ...JSON.parse(JSON.stringify(DB_USER)),
        refreshToken: undefined,
        verfied: undefined,
      },
      accessToken,
      refreshToken,
    });
  } catch (e) {
    sendFailureResponse(res, {
      mesage: 'Something went wrong. Please try again',
    });
  }
});

exports.getAccessToken = catchAsync(async (req, res, next) => {
  let {
    headers,
    body: { email },
  } = req;

  const refreshToken = headers['x-auth-refresh'];
  if (!refreshToken) return next(new Error('Provide auth token'));

  email = email.toLowerCase();
  DB_USER = await User.findOne({ email }).select('refreshToken');

  if (!DB_USER) {
    return next(new Error('Invalid auth credentials'));
  }

  if (DB_USER.refreshToken !== refreshToken) {
    return next(new Error('Invalid auth credentials'));
  }

  try {
    jwt.verify(refreshToken, env.refreshTokenSecret);
  } catch (e) {
    DB_USER.refreshToken = undefined;
    DB_USER.save().catch((e) => console.error(e.message));
    return next(e);
  }

  sendSuccessResponse(res, {
    accessToken: accessTokenCookieManager(res, email),
  });
});
