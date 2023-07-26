const {
  DEFAULT_SELECTED,
  select,
  includeOnly,
  getAllowedProperties
} = require('../../src/utils/user-doc')

const MOCK_DOCUMENT = { name: 'foo', age: 15, foo: 'foo', bar: 'bar' }
const MOCK_USER = {
  name: 'foo',
  phone: 'phone',
  email: 'foo@bar.com',
  role: 'foo-role',
  id: 1
}

describe('select function', () => {
  test('return a string', () => {
    expect(typeof select()).toBe('string')
  })

  describe(`return ${DEFAULT_SELECTED}`, () => {
    test('without arguments', () => {
      expect(select()).toBe(DEFAULT_SELECTED)
    })

    test('recieve one aregument and argument is in DEFAULT_SELECTED', () => {
      const selectedArr = DEFAULT_SELECTED.split(' ')
      expect(
        select(selectedArr[Math.floor(Math.random() * selectedArr.length)])
      ).toBe(DEFAULT_SELECTED)
    })

    test('empty string argugment', () => {
      expect(select('')).toBe(DEFAULT_SELECTED)
    })
  })
})

describe('includeOnly function', () => {
  describe('return', () => {
    test('', () => {
      expect(includeOnly(MOCK_DOCUMENT, 'foo bar')).toStrictEqual({
        foo: 'foo',
        bar: 'bar'
      })
    })

    test(`object with only properties with keys in ${DEFAULT_SELECTED}`, () => {
      expect(includeOnly(MOCK_DOCUMENT, 'foo', 'bar', 'name')).toStrictEqual({
        name: 'foo',
        foo: 'foo',
        bar: 'bar'
      })
    })

    test('empty object if no arguments are passed', () => {
      expect(includeOnly(MOCK_DOCUMENT)).toStrictEqual({})
    })

    test('ignore falsy arguments', () => {
      expect(includeOnly(MOCK_DOCUMENT, null, undefined, 0, [], '')).toStrictEqual(
        {}
      )
    })
  })
})

describe('getAllowedProperties function', () => {
  test(`return object with properties with keys in ${DEFAULT_SELECTED}`, () => {
    expect(getAllowedProperties({ ...MOCK_USER, foo: 'foo' })).toStrictEqual(
      MOCK_USER
    )
  })
})
