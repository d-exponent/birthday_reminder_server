const mongoose = require('mongoose');

const app = require('./src/app')();
const env = require('./src/env')();
const port = env.port;

const dbConnectUrl = `mongodb+srv://${env.dbUsername}:${env.dbPassword}@cluster0.ntzames.mongodb.net/${env.db}?retryWrites=true&w=majority`;
mongoose
  .connect(dbConnectUrl)
  .then(() => {
    console.log('👍👍 Connection succesfull');

    app.listen(port, () => {
      console.log('[Server] is running on port:', port);
    });
  })
  .catch((e) => console.error('🛑🛑Error', e.message));
