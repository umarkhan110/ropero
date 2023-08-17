// models/NestedSubcategories.js
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const SubNestedSubcategory = sequelize.define('SubNestedSubcategory', {
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
});

module.exports = SubNestedSubcategory;

