// models/NestedSubcategories.js
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const NestedSubcategory = sequelize.define('NestedSubcategory', {
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
});

module.exports = NestedSubcategory;

