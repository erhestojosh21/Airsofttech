const sql = require('mssql');

const config = {
  user: process.env.CONFIG_USER,
  password: process.env.CONFIG_PASSWORD,
  server: process.env.CONFIG_SERVER,
  database: process.env.CONFIG_DATABASE,
  options: {
    encrypt: true,  
    enableArithAbort: true,
    trustServerCertificate: true  
  },
  port: 1433, 

  pool: {
    max: 10,
    min: 0,
    //idleTimeoutMillis: 30000
  },
};

const pool = new sql.ConnectionPool(config);
const poolConnect = pool.connect();

module.exports = { pool, poolConnect };

console.log('DB Config:', config);  