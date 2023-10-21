import { DataTypes, Sequelize } from 'sequelize';
import sequelize from '../config/database.js'; // Initialize Sequelize connection

const Bank = sequelize.define('Bank', {
  QRId: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  Gloss: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  sourceBankId: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  originName: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  VoucherId: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  TransactionDateTime : {
    type: DataTypes.STRING,
    allowNull: false,
  },
  additionalData: {
    type: DataTypes.STRING,
    allowNull: false,
  }
});

export default Bank;