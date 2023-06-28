const mongoose = require('mongoose')
const { faker } = require('@faker-js/faker')
const User = require('./src/models/user')
const Birthday = require('./src/models/birthday')
const { MONGO_DB_URL } = require('./src/settings/constants')
const { generateRandomNumber } = require('./src/utils/auth')

const currentDate = new Date()

mongoose
  .connect(MONGO_DB_URL, { autoIndex: false })
  .then(async () => {
    console.log('👍Making Birthdays')
    for (let i = 0; i < 1000; i++) {
      try {
        // const user = await User.create({
        //   name: faker.person.fullName(),
        //   email: faker.internet.email(),
        //   phone: `+${faker.phone.number('234##########')}`
        // })

        await Birthday.create({
          name: faker.person.fullName(),
          email: faker.internet.email(),
          month: i % 2 === 0 ? currentDate.getMonth() + 1 : generateRandomNumber(11) + 1,
          day: i % 2 === 0 ? currentDate.getDate() : generateRandomNumber(30) + 1,
          owner: '649bdf7d1c629ddc3f4b90cd'
        })
      } catch (e) {
        console.log('🛑', e.message)
      }
    }
    console.log('👍DONE')
  })
  .catch((e) => console.log(e))
