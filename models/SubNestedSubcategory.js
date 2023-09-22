// models/NestedSubcategories.js
import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js'; // Initialize Sequelize connection

const SubNestedSubcategory = sequelize.define('SubNestedSubcategory', {
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
});

export default SubNestedSubcategory;

