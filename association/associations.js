// associations.js

const Category = require('../models/Category');
const Subcategory = require('../models/Subcategory');


Subcategory.belongsTo(Category, { as: 'category', foreignKey: 'categoryId' });
Subcategory.belongsTo(Subcategory, { as: 'parentSubcategory', foreignKey: 'parentSubcategoryId' });
Subcategory.hasMany(Subcategory, { as: 'childSubcategories', foreignKey: 'parentSubcategoryId' });
Subcategory.belongsTo(Subcategory, { as: 'nestedParentSubcategory', foreignKey: 'nestedParentSubcategoryId' });
Subcategory.hasMany(Subcategory, { as: 'nestedSubcategories', foreignKey: 'nestedParentSubcategoryId' });

