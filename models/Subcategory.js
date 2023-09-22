// models/Subcategories.js
import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js'; // Initialize Sequelize connection
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

export default Subcategory;

