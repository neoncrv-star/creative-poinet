require('dotenv').config();
const sequelize = require('../config/database');
const User = require('../models/User');

async function run() {
    try {
        await sequelize.authenticate();
        console.log('Database connected.');
        const users = await User.findAll({ raw: true });
        console.log('Users found:');
        console.log(JSON.stringify(users, null, 2));
    } catch (e) {
        console.error('Error:', e);
    } finally {
        await sequelize.close();
    }
}

run();
