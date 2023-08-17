const { DataTypes, Sequelize } = require('sequelize');
const sequelize = require('../config/database'); // Initialize Sequelize connection

const Brand = sequelize.define('Brand', {
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  }
});

module.exports = Brand;
