const { Sequelize } = require('sequelize');
const fs = require('fs');
const path = require('path');

const loadEnv = () => {
    const rootDir = path.join(__dirname, '..');
    const isProd = (process.env.NODE_ENV || '').toLowerCase() === 'production';
    const envProd = path.join(rootDir, '.env.prod');
    const envDev = path.join(rootDir, '.env');
    const legacy = [
        '/home/u494530316/domains/cpoint-sa.com/public_html/.env.prod',
        '/home/u494530316/domains/cpoint-sa.com/public_html/.env'
    ];
    const ordered = [];
    if (isProd) {
        if (fs.existsSync(envProd)) ordered.push(envProd);
        if (fs.existsSync(envDev)) ordered.push(envDev);
    } else {
        if (fs.existsSync(envDev)) ordered.push(envDev);
        if (!fs.existsSync(envDev) && fs.existsSync(envProd)) ordered.push(envProd);
    }
    legacy.forEach(f => ordered.push(f));
    for (const file of ordered) {
        try {
            if (fs.existsSync(file)) {
                require('dotenv').config({ path: file, override: true });
                console.log(`Loaded environment from: ${file}`);
                if (file === envProd || file === envDev) break;
            }
        } catch {}
    }
};

loadEnv();

const isProd = (process.env.NODE_ENV || '').toLowerCase() === 'production';
const preferSqlite = (process.env.DB_DIALECT || '').toLowerCase() === 'sqlite';
const missingMySqlCreds = !process.env.DB_NAME || !process.env.DB_USER;

let sequelize;

if (!isProd && (preferSqlite || missingMySqlCreds)) {
    const dataDir = path.join(__dirname, '..', 'data');
    try {
        if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
    } catch {}
    const sqliteFile = process.env.SQLITE_FILE || 'dev.sqlite';
    const storagePath = path.join(dataDir, sqliteFile);
    console.log(`Using SQLite Database at: ${storagePath}`);
    if (missingMySqlCreds && !preferSqlite) {
        console.warn('MySQL credentials missing. Falling back to SQLite for local development.');
    }
    sequelize = new Sequelize({
        dialect: 'sqlite',
        storage: storagePath,
        logging: (process.env.DB_LOGGING || 'false').toLowerCase() === 'true'
    });
} else {
    console.log('Using MySQL Database Configuration');
    sequelize = new Sequelize(
        process.env.DB_NAME,
        process.env.DB_USER,
        process.env.DB_PASSWORD || '',
        {
            host: process.env.DB_HOST || '127.0.0.1',
            dialect: 'mysql',
            logging: (process.env.DB_LOGGING || 'false').toLowerCase() === 'true',
            pool: {
                max: Number(process.env.DB_POOL_MAX || 5),
                min: Number(process.env.DB_POOL_MIN || 0),
                acquire: Number(process.env.DB_POOL_ACQUIRE || 30000),
                idle: Number(process.env.DB_POOL_IDLE || 10000)
            }
        }
    );
}

module.exports = sequelize;
