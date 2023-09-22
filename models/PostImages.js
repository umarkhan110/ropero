// models/Images.js
import { DataTypes, Sequelize } from 'sequelize';
import sequelize from '../config/database.js'; // Initialize Sequelize connection

const Images = sequelize.define('Images', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  postId: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  imageUrl: {
    type: DataTypes.STRING,
    allowNull: false,
  },
});

export default Images;
