  // models/Posts.js
  import { DataTypes } from 'sequelize';
  import sequelize from '../config/database.js'; // Initialize Sequelize connection
  import Images from '../models/PostImages.js';
  import Brand from '../models/Brand.js';
  import Category from '../models/Category.js';
  import Subcategory from '../models/Subcategory.js'
  import NestedSubcategory from '../models/NestedSubcategory.js'
  import SubNestedSubcategory from '../models/SubNestedSubcategory.js'
  import Colors from "../models/Colors.js";
  import Size from "../models/Size.js";
  import Material from "../models/Material.js";
  import User from "../models/User.js";


  const Posts = sequelize.define("Posts", {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    title: {
      type: DataTypes.STRING,
      allowNull: false
    },
    description: {
      type: DataTypes.STRING,
    },
    price: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    sizeId: {
      type: DataTypes.INTEGER,
      references: {
        model: Size,
        key: 'id',
      },
    },
    parcel_size: {
      type: DataTypes.STRING,
    },
    brandId: {
      type: DataTypes.INTEGER,
      references: {
        model: Brand,
        key: 'id',
      },
      allowNull: false,
    },
    condition: {
      type: DataTypes.STRING,
    },
    delivery_type: {
      type: DataTypes.STRING,
    },
    shipping: {
      type: DataTypes.BOOLEAN,
    },
    type: {
      type: DataTypes.STRING,
    },
    lat: {
      type: DataTypes.STRING,
    },
    lng: {
      type: DataTypes.STRING,
    },
    city: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    street: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    floor: {
      type: DataTypes.STRING,
    },
    state: {
      type: DataTypes.STRING,
    },
    categoryId: {
      type: DataTypes.INTEGER,
      references: {
        model: Category,
        key: 'id',
      },
      allowNull: false,
    },
    subcategoryId: {
      type: DataTypes.INTEGER,
      references: {
        model: Subcategory,
        key: 'id',
      }
    },
    nestedsubcategoryId: {
      type: DataTypes.INTEGER,
      references: {
        model: NestedSubcategory,
        key: 'id',
      },
      allowNull: false,
    },
    subnestedsubcategoryId: {
      type: DataTypes.INTEGER,
      references: {
        model: SubNestedSubcategory,
        key: 'id',
      },
      allowNull: false,
    },
    userId: {
      type: DataTypes.INTEGER,
      references: {
        model: User,
        key: 'id',
      },
      allowNull: false,
    },
    views: { // Add the 'views' field
      type: DataTypes.INTEGER,
      defaultValue: 0, // Set the default value to 0
    },
    is_Approved: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    }
  });

  // Create an association with the Images table
  Posts.hasMany(Images, { foreignKey: 'postId', as: 'images' });
  // Establish the association between Posts and Brand
  Posts.belongsTo(Brand, { foreignKey: 'brandId', as: 'brand' });
  Posts.belongsTo(Size, { foreignKey: 'sizeId', as: 'size' });
  Posts.belongsTo(Category, { foreignKey: 'categoryId', as: 'category' });
  Posts.belongsTo(Subcategory, { foreignKey: 'subcategoryId', as: 'subcategory' });
  Posts.belongsTo(NestedSubcategory, { foreignKey: 'nestedsubcategoryId', as: 'nestedsubcategory' });
  Posts.belongsTo(SubNestedSubcategory, { foreignKey: 'subnestedsubcategoryId', as: 'subnestedsubcategory' });
  Posts.belongsTo(User, { foreignKey: 'userId', as: 'user' });


  // Define the many-to-many association between Posts and Colors
Posts.belongsToMany(Colors, { through: 'PostColors', as: 'colors', foreignKey: 'postId' });
Colors.belongsToMany(Posts, { through: 'PostColors', as: 'posts', foreignKey: 'colorId' });

Posts.belongsToMany(Material, { through: 'PostMaterial', as: 'material', foreignKey: 'postId' });
Material.belongsToMany(Posts, { through: 'PostMaterial', as: 'posts', foreignKey: 'materialId' });

export default Posts;
