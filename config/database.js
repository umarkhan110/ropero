const Sequelize = require("sequelize");
const sequelize = new Sequelize(
 'ropero',
 'admin',
 'ropero123',
  {
    host: 'ropero.cgwcp983pesf.sa-east-1.rds.amazonaws.com',
    dialect: 'mysql'
  }
);
module.exports = sequelize;
