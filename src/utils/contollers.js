const authUtils = require('./auth');

exports.sendResponse = (res, params) => {
  res.status(params.status).json({ ...params, status: undefined });
};

exports.setFindParmasFromIdentifier = (identifier) => {
  const findParams = {};

  if (authUtils.validateEmail(identifier)) {
    findParams['email'] = identifier;
    return findParams;
  }
  if (authUtils.validatePhoneNumber(identifier)) {
    findParams['phone'] = identifier;
    return findParams;
  }

  return null;
};

exports.sendSuccessResponse = (res, params) => {
  this.sendResponse(res, {
    ...params,
    success: true,
    status: params.status || 200,
  });
};

exports.sendFailureResponse = (res, params) => {
  this.sendResponse(res, {
    ...params,
    success: false,
    status: params.status || 500,
  });
};
