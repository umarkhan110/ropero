// models/Images.js
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Images = sequelize.define('Images', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  postId: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  imageUrl: {
    type: DataTypes.STRING,
    allowNull: false,
  },
});

module.exports = Images;
