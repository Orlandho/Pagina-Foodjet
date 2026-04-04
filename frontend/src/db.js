const sql = require('mssql');

const dbInstance = process.env.DB_INSTANCE || undefined;
const dbPort = process.env.DB_PORT ? Number(process.env.DB_PORT) : undefined;

const config = {
    server: process.env.DB_SERVER || 'localhost',
    ...(dbInstance ? {} : { port: dbPort || 1433 }),
    user: process.env.DB_USER || 'foodJet_backend',
    password: process.env.DB_PASSWORD || 'ContraseniaSegura.67!',
    database: process.env.DB_NAME || 'FoodjetBackend',
    options: {
        ...(dbInstance ? { instanceName: dbInstance } : {}),
        encrypt: process.env.DB_ENCRYPT === 'true',
        trustServerCertificate: process.env.DB_TRUST_SERVER_CERTIFICATE !== 'false'
    },
    pool: {
        max: 10,
        min: 0,
        idleTimeoutMillis: 30000
    }
};

let poolPromise;

function getPool() {
    if (!poolPromise) {
        poolPromise = sql.connect(config);
    }

    return poolPromise;
}

module.exports = {
    sql,
    getPool
};
