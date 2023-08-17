// models/User.js
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Posts = sequelize.define('Posts', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
  },
  categoryId: {
    type: DataTypes.INTEGER,
  },
  subcategoryId: {
    type: DataTypes.INTEGER,
  },
  nestedsubcategoryId: {
    type: DataTypes.INTEGER,
  },
  subnestedsubcategoryId: {
    type: DataTypes.INTEGER,
  },
});

module.exports = Posts;