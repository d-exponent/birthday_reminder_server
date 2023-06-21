const titleCaseText = (text) =>
  text.charAt(0).toUpperCase() + text.slice(1).toLowerCase()

exports.titleCaseNames = (name) => {
  const names = name.split(' ')

  if (names.length === 1) {
    return titleCaseText(names[0])
  }

  return names.map((name) => titleCaseText(name)).join(' ')
}
