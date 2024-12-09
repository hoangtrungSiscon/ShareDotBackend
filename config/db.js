const { Pool } = require('pg');
require('dotenv').config();
const { Sequelize } = require('sequelize');


const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

const sequelize = new Sequelize(process.env.DB_NAME, process.env.DB_USER, process.env.DB_PASSWORD, {
  host: process.env.DB_HOST,
  dialect: 'postgres',
  port: process.env.DB_PORT,
  logging: false,
  dialectOptions: {
    ssl: {
      require: true,
      rejectUnauthorized: false
    }
  }
});

// const connectTest = async () => {
//     try {
//       await pool.query('SELECT NOW()'); // Truy vấn mẫu để kiểm tra kết nối
//       console.log("Kết nối thành công đến PostgreSQL!");
//     } catch (error) {
//       console.error("Lỗi kết nối đến PostgreSQL:", error);
//     }
//   };

const connectTest = async () => {
  try {
    await sequelize.authenticate(); // Thử kết nối bằng Sequelize
    console.log("Kết nối thành công đến PostgreSQL bằng Sequelize!");
  } catch (error) {
    console.error("Lỗi kết nối đến PostgreSQL:", error);
  }
};
  
connectTest();  

module.exports = sequelize;