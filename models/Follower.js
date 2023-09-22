// models/Follower.js
import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js'; // Initialize Sequelize connection
import User from './User.js';

const Follower = sequelize.define('Follower', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  followerId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: User, // Adjust the model name as needed
      key: 'id',
    },
  },
  followingId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: User, // Adjust the model name as needed
      key: 'id',
    },
  },
});

Follower.belongsTo(User, { foreignKey: 'followerId', as: 'user' });
export default Follower;
