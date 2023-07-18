const { databaseConnection } = require('./src/utils/db-connect')
const { faker } = require('@faker-js/faker')
const User = require('./src/models/user')
const Birthday = require('./src/models/birthday')
const { generateRandomNumber } = require('./src/utils/auth')

const currentDate = new Date()

const argv = process.argv
const loopCount = Number(argv[2])

// node filename count: Number
if (argv.length > 2 && loopCount > 1) {
  databaseConnection()
    .then(async res => {
      console.log(res)
      for (let i = 0; i < loopCount; i++) {
        try {
          const user = await User.create({
            name: faker.person.fullName(),
            email: faker.internet.email(),
            phone: `+${faker.phone.number('234##########')}`
          })
          await Birthday.create({
            name: faker.person.fullName(),
            email: faker.internet.email(),
            month:
              i % 2 === 0
                ? currentDate.getMonth() + 1
                : generateRandomNumber(11) + 1,
            day: i % 2 === 0 ? currentDate.getDate() : generateRandomNumber(30) + 1,
            owner: user.id
          })
        } catch (e) {
          console.log('🛑', e.message)
        }
      }
      console.log('👍DONE')
    })
    .catch(e => console.log(e))
}
