const titleCaseText = text => text.charAt(0).toUpperCase() + text.slice(1).toLowerCase()

/**
 *
 * @param { string } name
 * @returns
 */
exports.titleCaseNames = name => {
  const names = name.split(' ')

  return names.length === 1
    ? titleCaseText(names[0])
    : names.map(n => titleCaseText(n)).join(' ')
}
