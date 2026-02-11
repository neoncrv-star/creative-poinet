const User = require('./models/User');
const sequelize = require('./config/database');

async function resetAdmin() {
    try {
        await sequelize.authenticate();
        console.log('Database connected.');

        const admin = await User.findOne({ where: { username: 'admin' } });
        if (admin) {
            admin.password = 'password123';
            await admin.save();
            console.log('Admin password has been reset to: password123 (and hashed correctly)');
        } else {
            console.log('Admin user not found. Creating one...');
            await User.create({
                username: 'admin',
                password: 'password123',
                role: 'super_admin'
            });
            console.log('Admin user created with password: password123');
        }
        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

resetAdmin();