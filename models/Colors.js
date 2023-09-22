import { DataTypes, Sequelize } from 'sequelize';
import sequelize from '../config/database.js'; // Initialize Sequelize connection

const Colors = sequelize.define('Colors', {
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  }
});

export default Colors;
