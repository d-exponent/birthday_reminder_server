const {
  DEFAULT_SELECTS,
  defaultSelectsAnd,
  getModifiedByArgs,
  excludeNonDefaults
} = require('../../src/lib/utils')

const MOCK_DOCUMENT = { name: 'foo', age: 15, foo: 'foo', bar: 'bar' }
const MOCK_USER = {
  name: 'foo',
  phone: 'phone',
  email: 'foo@bar.com',
  role: 'foo-role',
  id: 1
}

describe('defaultSelectsAnd function', () => {
  test('return a string', () => {
    expect(typeof defaultSelectsAnd()).toBe('string')
  })

  describe(`return ${DEFAULT_SELECTS}`, () => {
    test('without arguments', () => {
      expect(defaultSelectsAnd()).toBe(DEFAULT_SELECTS)
    })

    test('recieve one aregument and argument is in DEFAULT_SELECTS', () => {
      const selectedArr = DEFAULT_SELECTS.split(' ')
      expect(
        defaultSelectsAnd(selectedArr[Math.floor(Math.random() * selectedArr.length)])
      ).toBe(DEFAULT_SELECTS)
    })

    test('empty string argugment', () => {
      expect(defaultSelectsAnd('')).toBe(DEFAULT_SELECTS)
    })
  })
})

describe('getModifiedByArgs function', () => {
  describe('return', () => {
    test('', () => {
      expect(getModifiedByArgs(MOCK_DOCUMENT, 'foo bar')).toStrictEqual({
        foo: 'foo',
        bar: 'bar'
      })
    })

    test(`object properties with keys in ${DEFAULT_SELECTS}`, () => {
      expect(getModifiedByArgs(MOCK_DOCUMENT, 'foo', 'bar', 'name')).toStrictEqual({
        name: 'foo',
        foo: 'foo',
        bar: 'bar'
      })
    })

    test('empty object if no arguments are passed', () => {
      expect(getModifiedByArgs(MOCK_DOCUMENT)).toStrictEqual({})
    })

    test('ignore falsy arguments', () => {
      expect(getModifiedByArgs(MOCK_DOCUMENT, null, undefined, 0, [], '')).toStrictEqual(
        {}
      )
    })
  })
})

describe('excludeNonDefaults function', () => {
  test(`return object properties with keys in ${DEFAULT_SELECTS}`, () => {
    expect(excludeNonDefaults({ ...MOCK_USER, foo: 'foo' })).toStrictEqual(MOCK_USER)
  })
})
