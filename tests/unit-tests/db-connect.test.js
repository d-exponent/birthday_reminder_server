const connectDb = require('../../src/utils/db-connect')
const mongoose = require('mongoose')
const { MONGO_DB_CONNECTION } = require('../../src/settings/constants')


afterEach(async () => {
  await mongoose.connection.close()
  MONGO_DB_CONNECTION.isActive = undefined
})

test('mongodb connection is successfull', async () => {
  // Establish a connection
  await expect(connectDb()).resolves.toBe('Connected to mongoDb successfully👍')
})

test('abort new mongodb connection if one already exists', async () => {
  //Establish a connection
  await connectDb()

  // New connection should abort to already active connection
  await expect(connectDb()).resolves.toBe('🤖 Connection is already active')
})

test('throw authentication error on incomplete/incorrect mongoDb credentials', async () => {
  const regex = /Authentication failed/

  // No parameters
  await expect(connectDb({})).rejects.toMatch(regex)

  // Incorrect dbPassword, incorrect db, missing dbUsername parameters
  await expect(connectDb({ dbPassword: 'foo', db: '' })).rejects.toMatch(regex)
})
