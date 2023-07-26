exports.DEFAULT_SELECTED = 'name phone email id role'

exports.getAllowedProperties = user => this.includeOnly(user, this.DEFAULT_SELECTED)

exports.select = (...args) => {
  return args.reduce(
    (acc, cur) => (cur.length === 0 || acc.includes(cur) ? acc : `${acc} ${cur}`),
    this.DEFAULT_SELECTED
  )
}

exports.includeOnly = (doc, ...args) => {
  argsLength = args.length
  if (argsLength === 0) return {}
  if (argsLength === 1) args = args[0].split(' ')

  const included = {}
  args.forEach(arg => {
    if (typeof arg !== 'string' || arg.length === 0) return
    if (doc[arg]) included[arg] = doc[arg]
  })
  return included
}
