import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js'; // Initialize Sequelize connection

const Rating = sequelize.define('Rating', {
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  rating: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  who_rated_me_id: {
    type: DataTypes.INTEGER,
    // allowNull: false,
  }
});

export default Rating;
