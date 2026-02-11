const sequelize = require('../config/database');
const User = require('../models/User');

async function setup() {
    try {
        await sequelize.authenticate();
        console.log('Connection has been established successfully.');
        
        // Sync models
        await sequelize.sync({ alter: true });
        console.log('Database synced.');

        // Ensure admin user exists
        const [admin, created] = await User.findOrCreate({
            where: { username: 'admin' },
            defaults: {
                password: 'password123',
                role: 'super_admin'
            }
        });

        if (!created) {
            admin.password = 'password123';
            await admin.save();
            console.log('Admin password reset to password123');
        } else {
            console.log('Admin user created with password123');
        }

        console.log('Setup completed successfully.');
        process.exit(0);
    } catch (error) {
        console.error('Unable to connect to the database:', error);
        process.exit(1);
    }
}

setup();
