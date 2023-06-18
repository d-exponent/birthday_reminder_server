const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const mongoSanitize = require('express-mongo-sanitize');
const rateLimit = require('express-rate-limit');
const morgan = require('morgan');

const userRouter = require('./routes/users');
const authRouter = require('./routes/auth');

const rateLimiter = rateLimit({
  windowMs: 20 * 60 * 1000,
  max: 150,
  standardHeaders: true,
  legacyHeaders: false,
});

module.exports = () => {
  const app = express();

  app.use(cors());
  app.use(cookieParser());
  app.use(rateLimiter);
  app.use(express.json());
  app.use(mongoSanitize());
  app.use(morgan());

  app.get('/api', (req, res) => {
    res.sendStatus(200);
  });

  app.use('/api/users', userRouter);
  app.use('/api/auth', authRouter);

  app.use('*', (req, res, next) => {
    res.sendStatus(404);
  });

  app.use((err, req, res, next) => {
    console.log(err);
    res.status(500).send(err.message);
  });

  return app;
};
