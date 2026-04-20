const User = require('../models/User');
const sequelize = require('../config/database');

async function seedAdmin() {
    try {
        await sequelize.authenticate();
        console.log('Connection established for seeding.');

        const adminExists = await User.findOne({ where: { username: 'admin' } });
        if (adminExists) {
            console.log('Admin user already exists.');
        } else {
            await User.create({
                username: 'admin',
                password: 'admin123',
                role: 'admin'
            });
            console.log('Admin user created successfully!');
            console.log('Username: admin');
            console.log('Password: admin123');
        }
    } catch (error) {
        console.error('Error seeding admin:', error);
    } finally {
        process.exit();
    }
}

seedAdmin();
