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

if (!process.env.DB_NAME || !process.env.DB_HOST || !process.env.DB_USER) {
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

const sequelize = new Sequelize(
    process.env.DB_NAME,
    process.env.DB_USER,
    process.env.DB_PASSWORD || '',
    {
        host: process.env.DB_HOST,
        dialect: 'mysql',
        logging: dbLogger,
        benchmark: true,
        pool: {
            max: 10,
            min: 2,
            idle: 10000,
            acquire: 30000
        },
        dialectOptions: {
            connectTimeout: Number(process.env.DB_CONNECT_TIMEOUT || 5000)
        },
        retry: {
            max: Number(process.env.DB_RETRY_MAX || 1)
        }
    }
);

const dialect = sequelize.getDialect && sequelize.getDialect();
if (dialect !== 'mysql') {
    const msg = `❌ Invalid DB dialect detected: ${dialect}. Only 'mysql' is allowed.`;
    console.error(msg);
    try {
        const logFile = path.join(__dirname, '..', 'debug.log');
        fs.appendFileSync(logFile, `[${new Date().toISOString()}] ${msg}\n`);
    } catch {}
    process.exit(1);
}

module.exports = sequelize;
