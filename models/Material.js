import { DataTypes, Sequelize } from 'sequelize';
import sequelize from '../config/database.js'; // Initialize Sequelize connection

const Material = sequelize.define('Material', {
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  }
});

export default Material;
