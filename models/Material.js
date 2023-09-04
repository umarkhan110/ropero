const { DataTypes, Sequelize } = require('sequelize');
const sequelize = require('../config/database'); // Initialize Sequelize connection

const Material = sequelize.define('Material', {
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  }
});

module.exports = Material;
