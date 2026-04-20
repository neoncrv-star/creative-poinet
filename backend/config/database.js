const { Sequelize } = require('sequelize');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

const loadEnv = () => {
    const rootDir = path.join(__dirname, '..');
    const isProd = (process.env.NODE_ENV || '').toLowerCase() === 'production';
    const envFile = isProd ? path.join(rootDir, '.env.prod') : path.join(rootDir, '.env');
    if (!fs.existsSync(envFile)) {
        console.error('❌ ENV file missing.');
        process.exit(1);
    }
    dotenv.config({ path: envFile, override: true });
    console.log(`Loaded environment from: ${envFile}`);
};

loadEnv();

const isSQLite = (process.env.DB_DIALECT || '').toLowerCase() === 'sqlite';

if (!isSQLite && (!process.env.DB_NAME || !process.env.DB_HOST || !process.env.DB_USER)) {
    console.error('❌ Missing MySQL environment variables. Server stopped.');
    process.exit(1);
}

const SLOW_DB_MS = Number(process.env.SLOW_DB_MS || 300);
const dbLogger = (msg, time) => {
    try {
        if (typeof time === 'number' && time >= SLOW_DB_MS) {
            const logFile = path.join(__dirname, '..', 'debug.log');
            fs.appendFileSync(logFile, `[${new Date().toISOString()}] SLOW-DB ${time}ms ${msg}\n`);
        }
    } catch {}
    if ((process.env.DB_LOGGING || 'false').toLowerCase() === 'true') {
        console.log(msg, typeof time === 'number' ? `${time}ms` : '');
    }
};

const sequelizeOptions = {
    dialect: process.env.DB_DIALECT || 'mysql',
    logging: dbLogger,
    benchmark: true,
    pool: {
        max: Number(process.env.DB_POOL_MAX || 10),
        min: Number(process.env.DB_POOL_MIN || 2),
        idle: Number(process.env.DB_POOL_IDLE || 10000),
        acquire: Number(process.env.DB_POOL_ACQUIRE || 30000)
    },
    retry: {
        max: Number(process.env.DB_RETRY_MAX || 1)
    }
};

if (!isSQLite) {
    sequelizeOptions.timezone = '+03:00';
}

if (isSQLite) {
    try {
        require.resolve('sqlite3');
        // SQLite specific configuration
        sequelizeOptions.storage = path.join(__dirname, '..', process.env.DB_STORAGE || 'data/database.sqlite');
        const dbDir = path.dirname(sequelizeOptions.storage);
        if (!fs.existsSync(dbDir)) {
            fs.mkdirSync(dbDir, { recursive: true });
        }
    } catch (e) {
        console.error('⚠️ SQLite driver missing. Falling back to MySQL logic.');
        sequelizeOptions.dialect = 'mysql';
        // Force isSQLite to false so we use the database credentials
        process.env.DB_DIALECT = 'mysql';
    }
}

if (sequelizeOptions.dialect === 'mysql') {
    // MySQL specific options
    sequelizeOptions.host = process.env.DB_HOST || '127.0.0.1';
    sequelizeOptions.port = Number(process.env.DB_PORT || 3306);
    sequelizeOptions.dialectOptions = {
        connectTimeout: Number(process.env.DB_CONNECT_TIMEOUT || 10000),
        charset: 'utf8mb4'
    };
    sequelizeOptions.define = {
        charset: 'utf8mb4',
        collate: 'utf8mb4_unicode_ci',
        timestamps: true
    };
}

const finalIsSQLite = (process.env.DB_DIALECT || '').toLowerCase() === 'sqlite';

const sequelize = finalIsSQLite
    ? new Sequelize(sequelizeOptions)
    : new Sequelize(
        process.env.DB_NAME,
        process.env.DB_USER,
        process.env.DB_PASSWORD || '',
        sequelizeOptions
    );

module.exports = sequelize;
