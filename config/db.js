const mysql = require('mysql2/promise');
const fs    = require('fs');
require('dotenv').config();

const pool = mysql.createPool({
  host:               process.env.DB_HOST,
  port:               process.env.DB_PORT,
  user:               process.env.DB_USER,
  password:           process.env.DB_PASSWORD,
  database:           process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit:    10,
  queueLimit:         0,
  ssl: {
    // Aiven requires SSL — this keeps the connection encrypted
    rejectUnauthorized: true,
    ca: process.env.DB_SSL_CERT
  }
});

module.exports = pool;