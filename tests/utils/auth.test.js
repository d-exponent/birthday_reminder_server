const { generateAccessCode, getTimeIn, signToken } = require('../../src/utils/auth')
const { REGEX } = require('../../src/settings/constants')

describe('generateAccessCode funtion', () => {
  test('accessCode is the default lenght of four (4)', () => {
    expect(generateAccessCode().length).toEqual(4)
  })

  describe('accessCode of length between 4 to 8, matches regular expression', () => {
    test('length of 4 matches regex', () => {
      expect(generateAccessCode()).toMatch(REGEX.accessCode)
    })
    test('length of 5 matches regex', () => {
      expect(generateAccessCode(5)).toMatch(REGEX.accessCode)
    })
    test('length of 6 matches regex', () => {
      expect(generateAccessCode(6)).toMatch(REGEX.accessCode)
    })
    test('length of 7 matches regex', () => {
      expect(generateAccessCode(7)).toMatch(REGEX.accessCode)
    })
    test('length of 8 matches regex', () => {
      expect(generateAccessCode(8)).toMatch(REGEX.accessCode)
    })
  })

  describe('accessCode adapts to varying length argument between 4 and 8', () => {
    test('adpats to length of 4', () => {
      expect(generateAccessCode().length).toEqual(4)
    })
    test('adpats to length of 5', () => {
      expect(generateAccessCode(5).length).toEqual(5)
    })
    test('adpats to length of 6', () => {
      expect(generateAccessCode(6).length).toEqual(6)
    })
    test('adpats to length of 7', () => {
      expect(generateAccessCode(7).length).toEqual(7)
    })
    test('adpats to length of 8', () => {
      expect(generateAccessCode(8).length).toEqual(8)
    })
  })

  describe('TypeError for length less than 4 or greater than 8', () => {
    const msg = 'length must between 4 to 8'
    test('lenght of 3', () => {
      expect(() => generateAccessCode(3)).toThrow(TypeError)
      expect(() => generateAccessCode(3)).toThrow(msg)
    })

    test('length of 4', () => {
      expect(() => generateAccessCode(9)).toThrow(TypeError)
      expect(() => generateAccessCode(9)).toThrow(msg)
    })
  })
})

describe('getTimeIn funtion', () => {
  const removeExtention = timeString => timeString.split('.')[0]

  test('return current time by default', () => {
    expect(removeExtention(getTimeIn().toString())).toEqual(
      removeExtention(new Date().toString())
    )
  })

  test('return time in target minutes', () => {
    const targetMins = 10
    expect(getTimeIn(targetMins)).toEqual(new Date(Date.now() + targetMins * 60000))
  })
})

describe('signToken', () => {
  const email = 'foo@bar.com'
  test('return a string', () => {
    expect(typeof signToken(email)).toBe('string')
  })

  test('return a token that matches jwt regular expression', () => {
    expect(signToken(email)).toMatch(REGEX.jwtToken)
  })

  describe('accepts only refresh and access as valid types', () => {
    test('refresh is a valid type', () => {
      expect(signToken(email, 'refresh')).toMatch(REGEX.jwtToken)
    })

    test('access is a valid type', () => {
      expect(signToken(email, 'access')).toMatch(REGEX.jwtToken)
    })

    test('only refresh and access are valid types', () => {
      expect(() => signToken(email, '')).toThrow(TypeError)
      expect(() => signToken(email, 1)).toThrow(TypeError)
      expect(() => signToken(email, true)).toThrow(TypeError)
      expect(() => signToken(email, {})).toThrow(TypeError)
      expect(() => signToken(email, true)).toThrow(TypeError)
      expect(() => signToken(email, {})).toThrow(TypeError)
      expect(() => signToken(email, 'foo')).toThrow(TypeError)
      expect(() => signToken(email, [])).toThrow(TypeError)
    })
  })
})
