import { DataTypes, Sequelize } from "sequelize";
import sequelize from "../config/database.js"; // Initialize Sequelize connection

const Notifications = sequelize.define("Notifications", {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  sender_name: {
    type: DataTypes.STRING,
  },
  sender_image: {
    type: DataTypes.STRING,
  },
  title: {
    type: DataTypes.STRING,
  },
  reciver_id: {
    type: DataTypes.INTEGER,
  },
  sender_id: {
    type: DataTypes.INTEGER,
  },
  status: {
    type: DataTypes.STRING,
    defaultValue: "unread",
  }
});

export default Notifications;

// ALTER TABLE `ropero`.`Notifications` 
// ADD COLUMN `status` VARCHAR(45) NULL DEFAULT 'unread' AFTER `updatedAt`;
// ALTER TABLE `ropero`.`Notifications` 
// ADD COLUMN `sender_id` INT NULL DEFAULT NULL AFTER `status`;