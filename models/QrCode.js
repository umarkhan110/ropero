import { DataTypes, Sequelize } from 'sequelize';
import sequelize from '../config/database.js'; // Initialize Sequelize connection
import User from './User.js';

const QrCode = sequelize.define('QrCode', {
  userId: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  packageId:{
    type: DataTypes.INTEGER
  },
  qrId: {
    type: DataTypes.STRING,
  },
  status:{
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: "Pending"
  },
  qr_code:{
    type: DataTypes.BLOB,
  },
  package_name: {
    type: DataTypes.STRING,
  },
  amount: {
    type: DataTypes.INTEGER,
  },
  credits: {
    type: DataTypes.INTEGER,
  }
});

QrCode.belongsTo(User, { foreignKey: 'userId' });
User.hasMany(QrCode, { foreignKey: 'userId' });

export default QrCode;


// ALTER TABLE `ropero`.`qrcodes` 
// CHANGE COLUMN `no_of_items` `credits` INT NULL DEFAULT '0' ;
