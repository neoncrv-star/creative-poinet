require('dotenv').config();
const sequelize = require('../config/database');
const User = require('../models/User');
const bcrypt = require('bcryptjs');

async function run() {
    try {
        await sequelize.authenticate();
        console.log('Database connected.');
        
        const username = 'admin';
        const password = 'admin123';
        
        const user = await User.findOne({ where: { username } });
        if (!user) {
            console.log('User not found.');
            return;
        }
        
        const isMatch = await bcrypt.compare(password, user.password);
        console.log(`Password match for "admin123": ${isMatch}`);
        
    } catch (e) {
        console.error('Error:', e);
    } finally {
        await sequelize.close();
    }
}

run();
