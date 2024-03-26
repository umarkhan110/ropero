// models/Ads.js
import { DataTypes } from "sequelize";
import sequelize from "../config/database.js";

const Ads = sequelize.define("Ads", {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  purpose: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
  },
  giff: {
    type: DataTypes.STRING,
  },

});

export default Ads;