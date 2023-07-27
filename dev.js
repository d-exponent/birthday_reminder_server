const connectDb = require('./src/utils/db-connect')
const User =  require('./src/models/user')
const Birthday = require('./src/models/birthday')


const run = async () => {
  try{
    await connectDb()
    const user await User.create({
      name: "Dessi Baby",
      email: "dessibaby@baby.com",
      role: 'user'
    })
  }catch(e){}

}