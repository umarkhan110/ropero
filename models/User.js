// models/User.js
import { DataTypes } from "sequelize";
import sequelize from "../config/database.js"; // Initialize Sequelize connection

const User = sequelize.define("User", {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  username: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  token: DataTypes.STRING,
  isVerified: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  resetToken: {
    type: DataTypes.STRING,
  },
  profileImage: {
    type: DataTypes.STRING,
  },
  address: {
    type: DataTypes.STRING,
  },
  city: {
    type: DataTypes.STRING,
  },
  state: {
    type: DataTypes.STRING,
  },
  credits: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
  no_of_posts: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
  provider: {
    type: DataTypes.STRING,
  },
  fcm_token: {
    type: DataTypes.STRING,
  },
  is_disabled: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
  },
});

export default User;


// ALTER TABLE `ropero`.`Users` 
// ADD COLUMN `credits` INT NULL DEFAULT 0 AFTER `state`;

