exports.EmailError = class EmailError extends Error {
  constructor(message) {
    super(message)
    this.name = 'EmailError'
    Error.captureStackTrace(this, this.constructor)
  }
}

exports.UserError = class UserError extends Error {
  constructor(message) {
    super(message)
    this.name = 'UserError'
    Error.captureStackTrace(this, this.constructor)
  }
}

exports.BirthdayReminderJobError = class BirthdayReminderJobError extends Error {
  constructor(message) {
    super(message)
    this.name = 'BirthdayReminderJobError'
    Error.captureStackTrace(this, this.constructor)
  }
}
