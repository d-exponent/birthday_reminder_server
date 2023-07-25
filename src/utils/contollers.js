const DEFAULT_SELECTED = 'name phone email id role'

exports.defaultSelectedUserValues = user => this.includeOnly(user, DEFAULT_SELECTED)

exports.baseSelect = (...args) => {
  let defaultSelected = DEFAULT_SELECTED
  args.length && args.forEach(arg => (defaultSelected = `${defaultSelected} ${arg}`))
  return defaultSelected
}

exports.includeOnly = (doc, ...args) => {
  argsLength = args.length
  if (argsLength === 0)
    throw new TypeError('You must provide at least one value to includeOnly')

  const included = {}
  if (argsLength === 1) args = args[0].split(' ')

  // Only include truty properties
  args.forEach(arg => (arg ? (included[arg] = doc[arg]) : undefined))
  return included
}
