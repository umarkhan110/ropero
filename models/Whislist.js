// models/Wishlist.js
import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js'; // Initialize Sequelize connection
import Posts from './Posts.js';
import User from './User.js';

const Wishlist = sequelize.define('Wishlist', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: User, // Adjust the model name if necessary
      key: 'id',
    },
  },
  postId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: Posts, // Adjust the model name if necessary
      key: 'id',
    },
  },
});

Wishlist.belongsTo(User, { foreignKey: 'userId', as: 'user' });
Wishlist.belongsTo(Posts, { foreignKey: 'postId', as: 'post' });

export default Wishlist;
