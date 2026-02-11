const { Sequelize } = require('sequelize');
const fs = require('fs');
const path = require('path');

// Automatically load .env from absolute path on server OR local path
const serverEnvPath = '/home/u494530316/domains/cpoint-sa.com/public_html/.env';
const localEnvPath = path.join(__dirname, '../.env');

if (fs.existsSync(serverEnvPath)) {
    require('dotenv').config({ path: serverEnvPath });
} else {
    require('dotenv').config({ path: localEnvPath });
}

let sequelize;

if (process.env.DB_NAME && process.env.DB_USER && process.env.DB_PASSWORD) {
    // MySQL Production Configuration
    sequelize = new Sequelize(process.env.DB_NAME, process.env.DB_USER, process.env.DB_PASSWORD, {
        host: process.env.DB_HOST || '127.0.0.1',
        dialect: 'mysql',
        logging: false,
        pool: {
            max: 5,
            min: 0,
            acquire: 30000,
            idle: 10000
        }
    });
} else {
    // SQLite Fallback - Ensure data directory exists
    const dataDir = path.join(__dirname, '../data');
    if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
    }
    
    sequelize = new Sequelize({
        dialect: 'sqlite',
        storage: path.join(dataDir, 'database.sqlite'),
        logging: false
    });
}

module.exports = sequelize;
