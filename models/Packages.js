import { DataTypes, Sequelize } from 'sequelize';
import sequelize from '../config/database.js'; // Initialize Sequelize connection

const Packages = sequelize.define('Packages', {
  package_name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  package_desc:{
    type: DataTypes.STRING,
  },
  credits: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  amount: {
    type: DataTypes.INTEGER,
    allowNull: false,
  }
});

export default Packages;

// name
// desc