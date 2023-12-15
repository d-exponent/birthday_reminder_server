const User = require('../src/models/user')
const Birthday = require('../src/models/birthday')
const connectDb = require('../src/lib/db-connect')
const emailRegex = require('../src/settings/constants').REGEX.email

const TODAY = new Date()

const getDay = index => {
  const currentDay = TODAY.getDate()
  if (index === 1) return currentDay
  if (index === 2) return currentDay + 1 // Tomorrow
  return currentDay + 7 // one week
}

;(async () => {
  const { argv, exit } = process

  if (argv.length < 3) {
    console.error(
      ".🛑ERROR: Provide the user's email address via CMD eg (node script email)"
    )
    exit(0)
  }

  if (!emailRegex.test(argv[2])) {
    console.error(`🛑ERROR: <${argv[2]}> is an invalid email`)
    exit(0)
  }
  console.log('RUNNING >✔✔✔')
  const userEmail = argv[2]

  try {
    await connectDb()
    const user = await User.findOne({ email: userEmail })

    if (user == null) {
      console.log(`${userEmail} is not associated with any user record.`)
      exit(0)
    }

    const month = TODAY.getMonth() + 1

    console.time('DONE✔✔')
    for (let i = 1; i <= 3; i += 1) {
      try {
        await Birthday.create({
          month,
          name: 'Fakename Username',
          day: getDay(i),
          owner: user['_id']
        })
      } catch (e) {
        console.log(e)
      }
    }
    console.timeEnd('DONE✔✔')
    exit(0)
  } catch (e) {
    console.log(e.message)
    exit(1)
  }
})()
