// models/Subcategories.js
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
// const Category = require('./Category');

const Subcategory = sequelize.define('Subcategory', {
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
});

// Subcategory.belongsTo(Category, { as: 'category', foreignKey: 'categoryId' });

// Subcategory.belongsTo(Subcategory, { as: 'parentSubcategory', foreignKey: 'parentSubcategoryId' });
// Subcategory.hasMany(Subcategory, { as: 'childSubcategories', foreignKey: 'parentSubcategoryId' });

// Subcategory.belongsTo(Subcategory, { as: 'nestedParentSubcategory', foreignKey: 'nestedParentSubcategoryId' });
// Subcategory.hasMany(Subcategory, { as: 'nestedSubcategories', foreignKey: 'nestedParentSubcategoryId' });

module.exports = Subcategory;

