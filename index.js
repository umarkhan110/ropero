// index.js
const express = require('express');
const session = require('express-session');
const { Sequelize } = require('sequelize');
const SequelizeStore = require('connect-session-sequelize')(session.Store);
const sequelize = require('./config/database');
const cors = require('cors');
const User = require('./models/User');
const Category = require('./models/Category');
const Subcategory = require('./models/Subcategory');
const NestedSubcategory = require('./models/NestedSubcategory');
const SubNestedSubcategory = require('./models/SubNestedSubcategory');

const app = express();

app.use(cors({
  origin: ['http://localhost:3000','https://main.d3vrydz5qdkx43.amplifyapp.com','https://www.elropero.app']
}));
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
app.use('/cate', require('./routes/categories'));
app.use('/utils', require('./routes/utils'));
app.use('/posts', require('./routes/post'));

Category.hasMany(Subcategory, {
  foreignKey: 'categoryId',
  as: 'Subcategory'
})
Subcategory.belongsTo(Category, {
  foreignKey: 'categoryId',
  as: 'Category'
})

Subcategory.hasMany(NestedSubcategory, {
  foreignKey: 'subcategoryId',
  as: 'NestedSubcategory'
})
NestedSubcategory.belongsTo(Subcategory, {
  foreignKey: 'subcategoryId',
  as: 'Subcategory'
})

NestedSubcategory.hasMany(SubNestedSubcategory, {
  foreignKey: 'nestedsubcategoryId',
  as: 'SubNestedSubcategory'
})
SubNestedSubcategory.belongsTo(NestedSubcategory, {
  foreignKey: 'nestedsubcategoryId',
  as: 'NestedSubcategory'
})

// Start server
const PORT = 3000;
sequelize.sync().then(() => {
  app.listen(PORT, () => {
    console.log(`Server started on port 3000`);
  });
});
