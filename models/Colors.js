const { DataTypes, Sequelize } = require('sequelize');
const sequelize = require('../config/database'); // Initialize Sequelize connection

const Colors = sequelize.define('Colors', {
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  }
});

module.exports = Colors;
