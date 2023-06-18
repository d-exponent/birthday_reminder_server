const authUtils = require('./auth');

exports.sendResponse = (res, params) => {
  res.status(params.status).json({
    success: params.success,
    data: params.data ? params.data : undefined,
    message: params.message ? params.message : undefined,
  });
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
