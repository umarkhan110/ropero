import { DataTypes } from "sequelize";
import sequelize from "../config/database.js";

const Banners = sequelize.define("Banners", {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  name: {
    type: DataTypes.STRING,
  },
  banner_video: {
    type: DataTypes.STRING,
  }
});

export default Banners;