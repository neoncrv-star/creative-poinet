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

console.log('Using MySQL Database Configuration (Mandatory)');

if (!process.env.DB_NAME || !process.env.DB_USER) {
    console.error('CRITICAL ERROR: MySQL credentials missing in environment variables!');
    // On local, we might want to throw error or provide clear guidance
}

const sequelize = new Sequelize(
    process.env.DB_NAME || 'creative_db', 
    process.env.DB_USER || 'root', 
    process.env.DB_PASSWORD || '', 
    {
        host: process.env.DB_HOST || '127.0.0.1',
        dialect: 'mysql',
        logging: false,
        pool: {
            max: 5,
            min: 0,
            acquire: 30000,
            idle: 10000
        }
    }
);

module.exports = sequelize;
