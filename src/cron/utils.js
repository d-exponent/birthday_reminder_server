/**
 * @param {number} days
 * @returns {number} total milliseconds of days
 */
exports.convertDaysToMilliseconds = days => days * 86400000

/**
 *
 * @param {number} days
 * @returns an object with the date of the day in days and the month in days. Month is indexed from 1.
 *
 */
exports.getDayAndMonth = days => {
  const dateInDays = new Date(Date.now() + this.convertDaysToMilliseconds(days))

  return {
    day: dateInDays.getDate(),
    month: dateInDays.getMonth() + 1
  }
}
