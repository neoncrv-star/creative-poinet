const { Sequelize } = require('sequelize');
const fs = require('fs');
const path = require('path');

// Function to load environment variables depending on NODE_ENV
const loadEnv = () => {
    const rootDir = path.join(__dirname, '..');
    const isProd = (process.env.NODE_ENV || '').toLowerCase() === 'production';
    const candidates = isProd
        ? [
            path.join(rootDir, '.env.prod'),
            path.join(rootDir, '.env')
        ]
        : [
            path.join(rootDir, '.env'),
            path.join(rootDir, '.env.prod')
        ];

    // Legacy fallbacks for existing server layout (Hostinger)
    const legacy = [
        '/home/u494530316/domains/cpoint-sa.com/public_html/.env.prod',
        '/home/u494530316/domains/cpoint-sa.com/public_html/.env'
    ];

    const envFiles = [...candidates, ...legacy];

    for (const file of envFiles) {
        if (fs.existsSync(file)) {
            require('dotenv').config({ path: file });
            console.log(`Loaded environment from: ${file}`);
            break;
        }
    }
};

loadEnv();

console.log('Using MySQL Database Configuration');

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
        logging: (process.env.DB_LOGGING || 'false').toLowerCase() === 'true',
        pool: {
            max: Number(process.env.DB_POOL_MAX || 5),
            min: Number(process.env.DB_POOL_MIN || 0),
            acquire: Number(process.env.DB_POOL_ACQUIRE || 30000),
            idle: Number(process.env.DB_POOL_IDLE || 10000)
        }
    }
);

module.exports = sequelize;
