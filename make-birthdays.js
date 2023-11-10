/* eslint-disable no-console */
// eslint-disable-next-line import/no-extraneous-dependencies
const { faker } = require('@faker-js/faker')
const { initiateDatabaseConnection } = require('./src/lib/db-connect')
const User = require('./src/models/user')
const Birthday = require('./src/models/birthday')
const { generateRandomNumber } = require('./src/lib/auth')

const currentDate = new Date()

const { argv } = process
const loopCount = Number(argv[2])

if (argv.length > 2 && loopCount > 1) {
  initiateDatabaseConnection()
    .then(async res => {
      console.log(res)

      new Array(loopCount).fill(0).forEach(async (_, i) => {
        try {
          // Make a new User Document
          const user = await User.create({
            name: faker.person.fullName(),
            email: faker.internet.email(),
            phone: `+${faker.phone.number('234##########')}`
          })

          // Make a new Birthday Document for user
          await Birthday.create({
            name: faker.person.fullName(),
            email: faker.internet.email(),
            month:
              i % 2 === 0 ? currentDate.getMonth() + 1 : generateRandomNumber(11) + 1,
            day: i % 2 === 0 ? currentDate.getDate() : generateRandomNumber(30) + 1,
            owner: user.id
          })
        } catch (e) {
          console.log('🛑', e.message)
        }
      })

      console.log('👍DONE')
    })
    .catch(e => console.log(e))
}
