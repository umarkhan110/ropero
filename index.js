// index.js
import express from 'express';
// const SequelizeStore = require('connect-session-sequelize')(session.Store);
import { initializeApp } from "firebase/app";
import sequelize from './config/database.js';
import cors from 'cors';
import User from './models/User.js';
import Category from './models/Category.js';
import Subcategory from './models/Subcategory.js';
import NestedSubcategory from './models/NestedSubcategory.js';
import SubNestedSubcategory from './models/SubNestedSubcategory.js';
import Rating from './models/Rating.js';
import firebaseConfig from './config/firebaseConfig.js';

const app = express();

// Initialize Firebase with your configuration
initializeApp(firebaseConfig);

app.use(cors({
  origin: ['http://localhost:3000','https://main.d3vrydz5qdkx43.amplifyapp.com','https://www.elropero.app']
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Session setup
// const sessionStore = new Sequelize({
//   db: sequelize,
// });

// app.use(
//   session({
//     secret: 'ASDFGHJKLTYUIOPQWERTYUIOPSDFGHJKLXCVBNMBWERTYUIOP',
//     store: sessionStore,
//     resave: false,
//     saveUninitialized: false,
//   })
// );

// Routes
import authRoutes from './routes/auth.js';
import categoriesRoutes from './routes/categories.js';
import utilsRoutes from './routes/utils.js';
import postRoutes from './routes/post.js';
import wishlistRoutes from './routes/whislist.js';
import followerRoutes from './routes/follower.js';
import ratingRoutes from './routes/rating.js';
import chatRoutes from './routes/chat.js';

app.use('/auth', authRoutes);
app.use('/cate', categoriesRoutes);
app.use('/utils', utilsRoutes);
app.use('/posts', postRoutes);
app.use('/whislist', wishlistRoutes);
app.use('/follower', followerRoutes);
app.use('/rating', ratingRoutes);
app.use('/chat', chatRoutes);

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

User.hasMany(Rating, { foreignKey: 'userId', as: 'Rating' });
Rating.belongsTo(User, { foreignKey: 'userId', as: 'User' });

// Start server
const PORT = 3000;
sequelize.sync().then(() => {
  app.listen(PORT, () => {
    console.log(`Server started on port 3000`);
  });
});
