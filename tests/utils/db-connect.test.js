const connectDb = require('../../src/utils/db-connect')
const mongoose = require('mongoose')
const { MONGO_DB_CONNECTION } = require('../../src/settings/constants')

beforeAll(async () => {
  await mongoose.connection.close()
  MONGO_DB_CONNECTION.isActive = undefined
})

afterEach(async () => {
  await mongoose.connection.close()
  MONGO_DB_CONNECTION.isActive = undefined
})

describe('mongodb connection function', () => {
  test('establish a new connection', async () => {
    await expect(connectDb()).resolves.toBe('Connected to mongoDb successfully👍')
  })

  test('abort new connection if one already exists', async () => {
    await connectDb() //Establish a connection
    // A new connection should abort for active connection
    await expect(connectDb()).resolves.toBe('🤖 Connection is already active')
  })

  describe('rejected promise message should match authentication failed regex', () => {
    const regex = /Authentication failed/

    test('empty object parameter', async () => {
      await expect(connectDb({})).rejects.toMatch(regex)
    })

    test('incomplete/incorrect object parameter', async () => {
      await expect(connectDb({ dbPassword: 'foo', db: '' })).rejects.toMatch(regex)
    })
  })
})
