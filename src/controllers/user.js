const User = require('../models/user');
const Email = require('../features/email');
const catchAsync = require('../utils/catchAsync');
const authUtils = require('../utils/auth');
const contollerUtils = require('../utils/contollers');

let DB_USER;
let FIND_PARAMS;

exports.createUser = catchAsync(async (req, res) => {
  const userData = {
    ...req.body,
    accessCode: authUtils.generateAccessCode(),
    accessCodeExpires: authUtils.getTimeIn((minutes = 10)),
    verified: undefined,
  };

  DB_USER = await User.create(userData);

  if (DB_USER) {
    DB_USER.accessCode = undefined;
    DB_USER.accessCodeExpires = undefined;
  }

  contollerUtils.sendResponse(res, {
    success: true,
    data: removeAccessCodeFeilds(DB_USER),
    status: 201,
  });

  const { name, email, accessCode } = DB_USER;
  try {
    await new Email(name, email).sendAccessCode(accessCode);
  } catch (e) {
    console.error(e.message);
  }
});

exports.getUsers = catchAsync(async (req, res) => {
  contollerUtils.sendResponse(res, {
    status: 200,
    data: await User.find(),
  });
});

exports.getUser = catchAsync(async ({ params: { identifier } }, res) => {
  FIND_PARAMS = contollerUtils.setFindParmasFromIdentifier(identifier);

  if (!FIND_PARAMS) {
    DB_USER = await User.findById(identifier);
  } else {
    DB_USER = await User.findOne(FIND_PARAMS);
  }

  contollerUtils.sendResponse(res, {
    success: true,
    data: DB_USER,
    status: 200,
  });
});

exports.updateUser = catchAsync(async (req, res) => {
  const {
    body,
    params: { identifier },
  } = req;
  FIND_PARAMS = contollerUtils.setFindParmasFromIdentifier(identifier);

  const updateParams = {
    new: true,
    runValidators: true,
  };

  if (!FIND_PARAMS) {
    DB_USER = await User.findByIdAndUpdate(identifier, body, updateParams);
  } else {
    DB_USER = await User.findOneAndUpdate(FIND_PARAMS, body, updateParams);
  }

  contollerUtils.sendResponse(res, {
    success: true,
    data: DB_USER,
    status: 200,
  });
});

exports.deleteUser = catchAsync(async ({ params: { identifier } }, res) => {
  FIND_PARAMS = contollerUtils.setFindParmasFromIdentifier(identifier);
  DB_USER = await User.findOneAndDelete(FIND_PARAMS);

  contollerUtils.sendResponse(res, {
    message: '',
    status: 204,
    success: true,
  });
});
