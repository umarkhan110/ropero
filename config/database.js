import Sequelize from 'sequelize';
import "dotenv/config"
const sequelize = new Sequelize(
 'ropero',
 process.env.DATABASE_NAME,
 process.env.DATABASE_PASSWORD,
  {
    host: 'localhost',
    dialect: 'mysql'
  }
);
export default sequelize;