const Sequelize = require("sequelize");
const sequelize = new Sequelize(
 'ropero',
 'root',
 'Great1.8',
  {
    host: 'localhost',
    dialect: 'mysql'
  }
);
module.exports = sequelize;