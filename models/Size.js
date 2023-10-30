import { DataTypes, Sequelize } from 'sequelize';
import sequelize from '../config/database.js'; // Initialize Sequelize connection

const Size = sequelize.define('Size', {
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  size_category: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  title :{
    type: DataTypes.STRING,
  }
});

export default Size;