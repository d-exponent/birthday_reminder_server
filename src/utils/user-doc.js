exports.DEFAULT_SELECTS = 'name phone email id role'

exports.excludeNonDefaults = user => this.assignOnly(user, this.DEFAULT_SELECTS)

exports.defaultSelectsAnd = (...args) => {
  const reducer = (accumulator, select) => {
    if (typeof select === 'string')
      return select.length === 0 ? accumulator : `${accumulator} ${select}`
    throw new TypeError('select arguments can only be strings')
  }
  const selects = args.reduce(reducer, this.DEFAULT_SELECTS)
  const uniqueSelects = [...new Set(selects.split(' '))]
  return uniqueSelects.join(' ')
}

exports.assignOnly = (doc, ...args) => {
  const assignDefined = (acc, key) => {
    if (doc[key] !== undefined) acc[key] = doc[key]
  }

  return args.reduce((accumulator, current) => {
    if (typeof current === 'string' && current.length) {
      if (current.includes(' ')) {
        current.split(' ').forEach(c => assignDefined(accumulator, c))
      } else {
        assignDefined(accumulator, current)
      }
    }
    return accumulator
  }, {})
}
