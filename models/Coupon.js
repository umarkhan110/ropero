import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';
import User from './User.js';
// import CouponUser from './CouponUser.js';

const Coupon = sequelize.define('Coupon', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
  },
  limit: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  timesUsed: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
  discountPrice: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
});

// Define a many-to-many association between Coupon and User through the CouponUser model
Coupon.belongsToMany(User, {
  through: "CouponUser",
  as: 'users',
  foreignKey: 'couponId',
});

User.belongsToMany(Coupon, {
  through: "CouponUser",
  as: 'coupons',
  foreignKey: 'userId',
});

export default Coupon;


// ALTER TABLE `ropero`.`coupons` 
// ADD COLUMN `limit` INT NOT NULL AFTER `userId`;
