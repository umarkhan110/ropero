// models/Posts.js
import { DataTypes } from "sequelize";
import sequelize from "../config/database.js";
import Images from "../models/PostImages.js";
import Brand from "../models/Brand.js";
import Category from "../models/Category.js";
import Subcategory from "../models/Subcategory.js";
import NestedSubcategory from "../models/NestedSubcategory.js";
import SubNestedSubcategory from "../models/SubNestedSubcategory.js";
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
  featured: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
  },
  featuredExpiry: {
    type: DataTypes.DATE,
  },
  reserved: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
  },
  reservedExpiry: {
    type: DataTypes.DATE,
  },
  reservedUserId: {
    type: DataTypes.NUMBER,
  },
  title: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  description: {
    type: DataTypes.STRING,
  },
  price: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  askToSeller: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  discount_price: {
    type: DataTypes.INTEGER,
  },
  sizeId: {
    type: DataTypes.INTEGER,
    references: {
      model: Size,
      key: "id",
    },
    allowNull: true,
  },
  parcel_size: {
    type: DataTypes.STRING,
  },
  brandId: {
    type: DataTypes.INTEGER,
    references: {
      model: Brand,
      key: "id",
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
  address: {
    type: DataTypes.STRING,
  },
  categoryId: {
    type: DataTypes.INTEGER,
    references: {
      model: Category,
      key: "id",
    },
    allowNull: false,
  },
  subcategoryId: {
    type: DataTypes.INTEGER,
    references: {
      model: Subcategory,
      key: "id",
    },
    allowNull: false,
  },
  nestedsubcategoryId: {
    type: DataTypes.INTEGER,
    references: {
      model: NestedSubcategory,
      key: "id",
    },
    defaultValue: null,
  },
  subnestedsubcategoryId: {
    type: DataTypes.INTEGER,
    references: {
      model: SubNestedSubcategory,
      key: "id",
    },
    defaultValue: null,
  },
  userId: {
    type: DataTypes.INTEGER,
    references: {
      model: User,
      key: "id",
    },
    allowNull: false,
  },
  views: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
  is_Approved: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
  },
  soldOut: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
  },
  soldOutStartTime: {
    type: DataTypes.DATE,
  },
});

Posts.hasMany(Images, { foreignKey: "postId", as: "images" });
Posts.belongsTo(Brand, { foreignKey: "brandId", as: "brand" });
Posts.belongsTo(Size, { foreignKey: "sizeId", as: "size" });
Posts.belongsTo(Category, { foreignKey: "categoryId", as: "category" });
Posts.belongsTo(Subcategory, {
  foreignKey: "subcategoryId",
  as: "subcategory",
});
Posts.belongsTo(NestedSubcategory, {
  foreignKey: "nestedsubcategoryId",
  as: "nestedsubcategory",
});
Posts.belongsTo(SubNestedSubcategory, {
  foreignKey: "subnestedsubcategoryId",
  as: "subnestedsubcategory",
});
Posts.belongsTo(User, { foreignKey: "userId", as: "user" });
Posts.belongsToMany(Colors, {
  through: "PostColors",
  as: "colors",
  foreignKey: "postId",
});
Colors.belongsToMany(Posts, {
  through: "PostColors",
  as: "posts",
  foreignKey: "colorId",
});

Posts.belongsToMany(Material, {
  through: "PostMaterial",
  as: "material",
  foreignKey: "postId",
});
Material.belongsToMany(Posts, {
  through: "PostMaterial",
  as: "posts",
  foreignKey: "materialId",
});

export default Posts;


// CREATE TABLE `ropero`.`Posts` (
//   `id` INT NOT NULL AUTO_INCREMENT,
//   `title` VARCHAR(255) NULL,
//   `description` VARCHAR(255) NULL DEFAULT NULL,
//   `price` INT NOT NULL,
//   `type` VARCHAR(45) NULL DEFAULT NULL,
//   `city` VARCHAR(45) NULL,
//   `sizeId` INT NULL DEFAULT NULL,
//   `parcel_size` VARCHAR(255) NULL DEFAULT NULL,
//   `brandId` INT NOT NULL,
//   `condition` VARCHAR(45) NULL DEFAULT NULL,
//   `delivery_type` VARCHAR(45) NULL DEFAULT NULL,
//   `shipping` TINYINT(1) NULL DEFAULT NULL,
//   `lat` VARCHAR(45) NULL DEFAULT NULL,
//   `lng` VARCHAR(45) NULL,
//   `street` VARCHAR(45) NULL,
//   `floor` VARCHAR(45) NULL,
//   `state` VARCHAR(45) NULL,
//   `categoryId` INT NOT NULL,
//   `subcategoryId` INT NULL,
//   `nestedsubcategoryId` INT NOT NULL,
//   `subnestedsubcategoryId` INT NOT NULL,
//   `userId` INT NOT NULL,
//   `views` INT NULL DEFAULT '0',
//   `is_Approved` TINYINT(1) NOT NULL,
//   `createdAt` DATETIME NOT NULL,
//   `updatedAt` DATETIME NOT NULL,
//   `discount_price` VARCHAR(45) NULL,
//   `featured` TINYINT(1) NULL DEFAULT '0',
//   `reserved` TINYINT(1) NULL DEFAULT '0',
//   `address` VARCHAR(45) NULL,
//   `featuredExpiry` VARCHAR(45) NULL,
//   `reservedUserId` INT NULL,
//   `reservedExpiry` VARCHAR(45) NULL,
//   PRIMARY KEY (`id`))
// ENGINE = InnoDB
// DEFAULT CHARACTER SET = utf8mb4;


// ALTER TABLE `ropero`.`Posts` 
// CHANGE COLUMN `type` `type` VARCHAR(255) NULL DEFAULT NULL ,
// CHANGE COLUMN `city` `city` VARCHAR(255) NULL DEFAULT NULL ,
// CHANGE COLUMN `condition` `condition` VARCHAR(255) NULL DEFAULT NULL ,
// CHANGE COLUMN `delivery_type` `delivery_type` VARCHAR(255) NULL DEFAULT NULL ,
// CHANGE COLUMN `lat` `lat` VARCHAR(255) NULL DEFAULT NULL ,
// CHANGE COLUMN `lng` `lng` VARCHAR(255) NULL DEFAULT NULL ,
// CHANGE COLUMN `street` `street` VARCHAR(255) NULL DEFAULT NULL ,
// CHANGE COLUMN `floor` `floor` VARCHAR(255) NULL DEFAULT NULL ,
// CHANGE COLUMN `state` `state` VARCHAR(255) NULL DEFAULT NULL ,
// CHANGE COLUMN `discount_price` `discount_price` VARCHAR(255) NULL DEFAULT NULL ,
// CHANGE COLUMN `address` `address` VARCHAR(255) NULL DEFAULT NULL ,
// CHANGE COLUMN `featuredExpiry` `featuredExpiry` VARCHAR(255) NULL DEFAULT NULL ,
// CHANGE COLUMN `reservedExpiry` `reservedExpiry` VARCHAR(255) NULL DEFAULT NULL ;


// ALTER TABLE `ropero`.`Posts` 
// DROP FOREIGN KEY `posts_ibfk_4`,
// DROP FOREIGN KEY `posts_ibfk_5`,
// DROP FOREIGN KEY `posts_ibfk_6`;
// ALTER TABLE `ropero`.`Posts` 
// CHANGE COLUMN `subcategoryId` `subcategoryId` INT NOT NULL ,
// CHANGE COLUMN `nestedsubcategoryId` `nestedsubcategoryId` INT NULL ,
// CHANGE COLUMN `subnestedsubcategoryId` `subnestedsubcategoryId` INT NULL ;
// ALTER TABLE `ropero`.`Posts` 
// ADD CONSTRAINT `posts_ibfk_4`
//   FOREIGN KEY (`subcategoryId`)
//   REFERENCES `ropero`.`Subcategories` (`id`)
//   ON UPDATE CASCADE,
// ADD CONSTRAINT `posts_ibfk_5`
//   FOREIGN KEY (`nestedsubcategoryId`)
//   REFERENCES `ropero`.`NestedSubcategories` (`id`)
//   ON UPDATE CASCADE,
// ADD CONSTRAINT `posts_ibfk_6`
//   FOREIGN KEY (`subnestedsubcategoryId`)
//   REFERENCES `ropero`.`SubNestedSubcategories` (`id`)
//   ON UPDATE CASCADE;



// ALTER TABLE `ropero`.`Posts` 
// ADD COLUMN `askToSeller` TINYINT NULL DEFAULT 0 AFTER `address`,
// CHANGE COLUMN `price` `price` INT NULL ;


// ALTER TABLE `ropero`.`Posts` 
// ADD COLUMN `soldOut` TINYINT NOT NULL DEFAULT 0 AFTER `askToSeller`,
// ADD COLUMN `soldOutStartTime` VARCHAR(45) NULL AFTER `soldOut`;
