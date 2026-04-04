const useNativeDriver = process.platform === 'win32' && process.env.DB_DRIVER !== 'tedious';
const sql = useNativeDriver ? require('mssql/msnodesqlv8') : require('mssql');

const dbServer = process.env.DB_SERVER || 'localhost';
const dbPort = process.env.DB_PORT ? Number(process.env.DB_PORT) : undefined;
const dbInstance = process.env.DB_INSTANCE || undefined;
const dbUser = process.env.DB_USER || 'foodJet_backend';
const dbPassword = process.env.DB_PASSWORD || 'ContraseniaSegura.67!';
const dbName = process.env.DB_NAME || 'FoodjetBackend';
const dbProtocol = process.env.DB_PROTOCOL || '';
const nativeServerTarget = dbProtocol.toLowerCase() === 'lpc'
    ? `lpc:${dbServer}`
    : `${dbServer}${dbInstance ? `\\${dbInstance}` : ''}`;

const config = useNativeDriver
    ? {
        connectionString: `Driver={ODBC Driver 17 for SQL Server};Server=${nativeServerTarget};Database=${dbName};Uid=${dbUser};Pwd=${dbPassword};TrustServerCertificate=Yes;`,
        options: {
            trustedConnection: process.env.DB_TRUSTED_CONNECTION === 'true'
        },
        pool: {
            max: 10,
            min: 0,
            idleTimeoutMillis: 30000
        }
    }
    : {
        server: dbServer,
        ...(dbInstance ? {} : { port: dbPort || 1433 }),
        user: dbUser,
        password: dbPassword,
        database: dbName,
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
