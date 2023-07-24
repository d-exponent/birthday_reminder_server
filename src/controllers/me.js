const AppError = require('../utils/app-error')
const Birthday = require('../models/birthday')
const catchAsync = require('../utils/catch-async')
const { sendResponse } = require('../utils/contollers')
const { RESPONSE, STATUS } = require('../settings/constants')

let error_msg

exports.deleteMe = catchAsync(async (req, res) => {
  req.currentUser.isActive = false
  req.currentUser.isVerified = false
  await req.currentUser.save()

  sendResponse(RESPONSE.success, res, {
    status: STATUS.success.noContent,
    message: ''
  })
})

//              -----   HELPER MIDDLEWARES ----     //
exports.setMyIdOnParams = ({ params, currentUser }, _, next) => {
  params.ownerId = params['user_email_phone_id'] = currentUser['_id']
  next()
}

exports.setBodyAddOwner = ({ body, currentUser }, _, next) => {
  body.owner = currentUser['_id']
  next()
}

exports.checkUserOwnsBirthday = catchAsync(
  async ({ method, params, currentUser }, _, next) => {
    // CRUD on a birthday can only be done by the user who created it
    const birthday = await Birthday.findById(params.id)

    if (!birthday) {
      error_msg = "The requested birthday doesn't exists."
      return next(new AppError(error_msg, STATUS.error.notFound))
    }

    if (JSON.stringify(birthday.owner) !== JSON.stringify(currentUser['_id'])) {
      const crud =
        method === 'PATCH' ? 'update' : method === 'DELETE' ? 'delete' : 'read'
      error_msg = `You can only ${crud} the birthday(s) that the you created`
      return next(new AppError(error_msg, STATUS.error.forbidden))
    }
    next()
  }
)

exports.restrictToUpdate = ({ body }, _, next) => {
  const allowed = ['name', 'phone']
  Object.keys(body).forEach(key => {
    if (!allowed.includes(key)) {
      error_msg = `You are not allowed to update the /${key}/ on this route`
      return next(new AppError(error_msg, STATUS.error.forbidden))
    }
  })

  next()
}
