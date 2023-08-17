// models/Category.js
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Category = sequelize.define('Category', {
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  }
  // level: {
  //   type: DataTypes.INTEGER
  // },
});

// Category.hasMany(Category, { as: 'subcategories', foreignKey: 'parentId' });
// Category.addHook('beforeCreate', async (category, options) => {
//   if (category.parentId) {
//     const parentCategory = await Category.findByPk(category.parentId);
//     category.level = parentCategory.level + 1;
//   } else {
//     category.level = 1; // If it's a top-level category
//   }
// });

module.exports = Category;
