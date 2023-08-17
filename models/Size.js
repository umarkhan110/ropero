const { DataTypes, Sequelize } = require('sequelize');
const sequelize = require('../config/database'); // Initialize Sequelize connection

const Size = sequelize.define('Size', {
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  }
});

module.exports = Size;
