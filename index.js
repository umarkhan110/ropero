// index.js
const express = require('express');
const session = require('express-session');
const { Sequelize } = require('sequelize');
const SequelizeStore = require('connect-session-sequelize')(session.Store);
const sequelize = require('./config/database');
const User = require('./models/User');

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Session setup
const sessionStore = new SequelizeStore({
  db: sequelize,
});

app.use(
  session({
    secret: 'ASDFGHJKLTYUIOPQWERTYUIOPSDFGHJKLXCVBNMBWERTYUIOP',
    store: sessionStore,
    resave: false,
    saveUninitialized: false,
  })
);

// Routes
app.use('/auth', require('./routes/auth'));

// Start server
const PORT = 3000;
sequelize.sync().then(() => {
  app.listen(PORT, () => {
    console.log(`Server started on port 3000`);
  });
});
