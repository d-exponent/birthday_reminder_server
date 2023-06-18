const User = require('../models/user');
const Email = require('../features/email');
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
let FIND_PARAMS;

exports.createUser = catchAsync(async (req, res) => {
  let { email } = req.body;

  const userData = {
    ...req.body,
    accessCode: generateAccessCode(),
    accessCodeExpires: getTimeIn((minutes = 10)),
    refreshToken: signRefreshToken(email),
    verified: undefined,
  };

  DB_USER = await User.create(userData);

  sendSuccessResponse(res, {
    data: {
      ...JSON.parse(JSON.stringify(DB_USER)),
      accessCode: undefined,
      accessCodeExpires: undefined,
      refreshToken: undefined,
    },
    accessToken: accessTokenCookieManager(res, email),
    refreshToken: DB_USER.refreshToken,
    message: `Check ${DB_USER.email} for the one time password to verify your profile`,
  });

  let { name, accessCode } = DB_USER;
  try {
    await DB_USER.save();
    await new Email(name, DB_USER.email).sendAccessCode(accessCode);
  } catch (e) {
    console.error(e.message);
  }
});

exports.getUsers = catchAsync(async (req, res) => {
  sendSuccessResponse(res, {
    data: await User.find(),
  });
});

exports.getUser = catchAsync(async ({ params: { identifier } }, res) => {
  FIND_PARAMS = setFindParmasFromIdentifier(identifier);

  if (!FIND_PARAMS) {
    DB_USER = await User.findById(identifier);
  } else {
    DB_USER = await User.findOne(FIND_PARAMS);
  }

  sendSuccessResponse(res, {
    data: DB_USER,
  });
});

exports.updateUser = catchAsync(async (req, res) => {
  const {
    body,
    params: { identifier },
  } = req;
  FIND_PARAMS = setFindParmasFromIdentifier(identifier);

  const updateParams = {
    new: true,
    runValidators: true,
  };

  if (!FIND_PARAMS) {
    DB_USER = await User.findByIdAndUpdate(identifier, body, updateParams);
  } else {
    DB_USER = await User.findOneAndUpdate(FIND_PARAMS, body, updateParams);
  }

  sendSuccessResponse(res, {
    data: DB_USER,
  });
});

exports.deleteUser = catchAsync(async ({ params: { identifier } }, res) => {
  FIND_PARAMS = setFindParmasFromIdentifier(identifier);
  DB_USER = await User.findOneAndDelete(FIND_PARAMS);

  sendSuccessResponse(res, {
    status: 204,
  });
});
