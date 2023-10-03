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
});

export default Notifications;
