const { Sequelize } = require('sequelize');
const path = require('path');

let sequelize;

if (process.env.DB_NAME && process.env.DB_USER && process.env.DB_PASSWORD) {
    // MySQL Production Configuration
    sequelize = new Sequelize(
        process.env.DB_NAME,
        process.env.DB_USER,
        process.env.DB_PASSWORD,
        {
            host: process.env.DB_HOST || 'localhost',
            dialect: 'mysql',
            logging: false
        }
    );
} else {
    // SQLite Development Configuration
    sequelize = new Sequelize({
        dialect: 'sqlite',
        storage: path.join(__dirname, '../data/database.sqlite'),
        logging: false
    });
}

module.exports = sequelize;
