exports.DEFAULT_SELECTS = 'name phone email id role'

exports.excludeNonDefaults = user => this.filter(user, this.DEFAULT_SELECTS)

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

// TODO: Find a better name
exports.filter = (doc, ...args) => {
  const getDefined = (acc, key) => {
    if (doc[key] !== undefined) acc[key] = doc[key]
  }

  return args.reduce((accumulator, current) => {
    if (typeof current === 'string' && current.length) {
      if (current.includes(' ')) {
        current.split(' ').forEach(c => getDefined(accumulator, c))
      } else {
        getDefined(accumulator, current)
      }
    }
    return accumulator
  }, {})
}

exports.defineGetter = (obj, name, getter) => {
  Object.defineProperty(obj, name, {
    configurable: false,
    get: getter
  })
}
