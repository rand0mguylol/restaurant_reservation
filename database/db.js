if (process.env.NODE_ENV !== "production") {
  require('dotenv').config();
}

const sql = require('mssql')
const MSSQLStoreNew = require('connect-mssql-v2');

const storeConfig = {
user: process.env.DB_USER,
password: process.env.DB_PWD,
server: 'localhost', // You can use 'localhost' to connect to named instance
database: process.env.DB_NAME,
options: {
  encrypt: false, // Use this if you're on Windows Azure
  trustServerCertificate: true // use this if your MS SQL instance uses a self signed certificate
}
};

const MSSQLStore = new MSSQLStoreNew(storeConfig)

const sqlConfig = {
user: process.env.DB_USER,
password: process.env.DB_PWD,
database: process.env.DB_NAME,
server: 'localhost',
pool: {
  max: 30,
  min: 0,
  idleTimeoutMillis: 3000
},
options: {
  encrypt: false, // for azure
  trustServerCertificate: true // change to true for local dev / self-signed certs
}
}

const connection = new sql.ConnectionPool(sqlConfig)

async function connectionPromise() {
try{
  const pool = await connection.connect()
  console.log("Successfully establish connection to database")
  return pool
}catch(err) {
  console.log("Something went wrong when connecting to the database")
  return next(err)
  
}
}

module.exports = {
sql, connectionPromise, MSSQLStore
}

