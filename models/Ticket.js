// models/Ticket.js
import { DataTypes } from "sequelize";
import sequelize from "../config/database.js"; // Initialize Sequelize connection

const Ticket = sequelize.define("Ticket", {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  description: {
    type: DataTypes.STRING,
    allowNull: false,
  }, 
  adminResponse: {
    type: DataTypes.STRING,
  }  
});

export default Ticket;