const mysql = require('mysql2/promise');

const dbHost = process.env.DB_HOST || 'localhost';
const dbPort = process.env.DB_PORT ? Number(process.env.DB_PORT) : 3306;
const dbUser = process.env.DB_USER || 'foodJet_backend';
const dbPassword = process.env.DB_PASSWORD || 'ContraseniaSegura.67!';
const dbName = process.env.DB_NAME || 'FoodjetBackend';

const config = {
    host: dbHost,
    port: dbPort,
    user: dbUser,
    password: dbPassword,
    database: dbName,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
};

let pool;

function getPool() {
    if (!pool) {
        pool = mysql.createPool(config);
    }
    return pool;
}

module.exports = {
    getPool
};
