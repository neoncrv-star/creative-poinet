require('dotenv').config();
const sequelize = require('../config/database');
const User = require('../models/User');
const bcrypt = require('bcryptjs');

async function run() {
    try {
        await sequelize.authenticate();
        console.log('Database connected.');
        
        const username = 'admin';
        const newPassword = 'admin123';
        const hashedPassword = await bcrypt.hash(newPassword, 10);
        
        const [user, created] = await User.findOrCreate({
            where: { username },
            defaults: {
                password: hashedPassword,
                role: 'super_admin'
            }
        });
        
        if (!created) {
            user.password = hashedPassword;
            await user.save();
            console.log(`Password for user "${username}" has been reset to "${newPassword}"`);
        } else {
            console.log(`User "${username}" created with password "${newPassword}"`);
        }
        
    } catch (e) {
        console.error('Error:', e);
    } finally {
        await sequelize.close();
    }
}

run();
