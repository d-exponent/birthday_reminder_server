const User = require('../models/user');

const env = require('../env')();
const Email = require('../features/email');
const jwt = require('jsonwebtoken');
const catchAsync = require('../utils/catchAsync');
const authUtils = require('../utils/auth');
const controllerUtils = require('../utils/contollers');

let DB_USER;

const signToken = (options) => {
  return jwt.sign(options, env.jwtSecret, {
    expiresIn: Number(env.jwt_expires),
  });
};

const tokenCookieManager = (res, userInfo) => {
  const token = signToken(userInfo);
  res.cookie('jwt', token, {
    httpOnly: true,
    expires: new Date(Date.now() + env.jwt_expires * 24 * 60 * 60000),
    secure: true,
  });

  return token;
};

exports.requestAccessCode = catchAsync(
  async ({ params: { identifier } }, res) => {
    const params = controllerUtils.setFindParmasFromIdentifier(identifier);

    if (!params) {
      DB_USER = await User.findById(identifier);
    } else {
      DB_USER = await User.findOne(params);
    }

    if (!DB_USER) {
      return controllerUtils.sendResponse(res, {
        status: 404,
        message: 'The user does not exist',
        success: false,
      });
    }

    DB_USER.accessCode = authUtils.generateAccessCode();
    DB_USER.accessCodeExpires = authUtils.getTimeIn((minutes = 10));
    DB_USER.verfied = false;
    const emailer = new Email(DB_USER.name, DB_USER.email);

    DB_USER.save()
      .then(async () => {
        try {
          await emailer.sendAccessCode(DB_USER.accessCode);
          controllerUtils.sendResponse(res, {
            success: true,
            status: 200,
            message: `An access code has been sent to ${DB_USER.email}. Expires in ten (10) minutes`,
          });
        } catch (e) {
          return e;
        }
      })
      .catch(() => {
        controllerUtils.sendResponse(res, {
          status: 500,
          success: true,
          message: 'Something went wrong!',
        });
      });
  }
);

exports.login = catchAsync(async ({ params: { identifier } }, res) => {
  //
  DB_USER = await User.findOne({ accessCode: identifier });

  if (!DB_USER) {
    return controllerUtils.sendResponse(res, {
      status: 404,
      message: 'Inavlid credentials',
      success: false,
    });
  }

  if (Date.now() > DB_USER.accessCodeExpires.getTime()) {
    controllerUtils.sendResponse(res, {
      status: 401,
      success: false,
      message: 'Expired credentials.',
    });
    return;
  }

  DB_USER.accessCode = undefined;
  DB_USER.accessCodeExpires = undefined;
  DB_USER.verfied = true;

  try {
    await DB_USER.save();
    controllerUtils.sendResponse(res, {
      status: 200,
      success: true,
      data: DB_USER,
      accessCode: tokenCookieManager(res, {
        id: DB_USER.id,
        email: DB_USER.email,
      }),
    });
  } catch (e) {
    controllerUtils.sendResponse(res, {
      success: false,
      mesage: 'Something went wrong. Please try again',
      status: 500,
    });
  }
});
