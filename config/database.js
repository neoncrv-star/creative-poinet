const { Sequelize } = require('sequelize');
const fs = require('fs');
const path = require('path');

// Function to load environment variables from multiple possible locations
const loadEnv = () => {
    const rootDir = path.join(__dirname, '..');
    const envFiles = [
        '/home/u494530316/domains/cpoint-sa.com/public_html/.env',
        '/home/u494530316/domains/cpoint-sa.com/public_html/.env.prod',
        path.join(rootDir, '.env'),
        path.join(rootDir, '.env.prod')
    ];

    for (const file of envFiles) {
        if (fs.existsSync(file)) {
            require('dotenv').config({ path: file });
            console.log(`Loaded environment from: ${file}`);
            break;
        }
    }
};

loadEnv();

let sequelize;

// Force MySQL if credentials exist, otherwise use SQLite locally
if (process.env.DB_NAME && process.env.DB_USER) {
    console.log('Using MySQL Database Configuration');
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
    console.log('Using SQLite Fallback Database');
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
