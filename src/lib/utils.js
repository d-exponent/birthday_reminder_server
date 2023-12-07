const uniqueArgs = args => [...new Set(args)]

exports.DEFAULT_SELECTS = 'name phone email id role'

exports.excludeNonDefaults = user => this.getModifiedByArgs(user, this.DEFAULT_SELECTS)

/**
 *
 * @param  {...string} args
 * @returns default selects concatenated with strings passed as args.
 * If the same arg is passed more that once, only one will be concatenated
 */
exports.defaultSelectsAnd = (...args) =>
  uniqueArgs(args).reduce((acc, arg) => `${acc} ${arg}`, this.DEFAULT_SELECTS)

// TODO: Find a better name
/**
 *
 * @param {object} doc
 * @param  {...string} args
 * @returns object with property whose keys are
 * passed in as args and whose values are defined and are in the doc object
 */
exports.getModifiedByArgs = (doc, ...args) => {
  const getDefined = (acc, key) => {
    if (doc[key] !== undefined) acc[key] = doc[key]
  }

  const reducer = (acc, cur) => {
    if (typeof cur === 'string' && cur.length) {
      if (cur.includes(' ')) cur.split(' ').forEach(c => getDefined(acc, c))
      else getDefined(acc, cur)
    }
    return acc
  }

  return uniqueArgs(args).reduce(reducer, {})
}
