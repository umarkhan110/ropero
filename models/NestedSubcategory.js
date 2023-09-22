// models/NestedSubcategories.js
import { DataTypes, Sequelize } from 'sequelize';
import sequelize from '../config/database.js'; // Initialize Sequelize connection

const NestedSubcategory = sequelize.define('NestedSubcategory', {
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
});

export default NestedSubcategory;

