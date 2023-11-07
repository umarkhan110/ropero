import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const CouponUser = sequelize.define('CouponUser', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  couponId: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
});

export default CouponUser;
