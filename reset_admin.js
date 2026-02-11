const User = require('./models/User');
const sequelize = require('./config/database');
const bcrypt = require('bcryptjs');

async function resetAdmin() {
    try {
        await sequelize.sync({ alter: true });
        
        // Find existing admin or create new one
        let admin = await User.findOne({ where: { username: 'admin' } });
        
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash('password123', salt);

        if (admin) {
            await admin.update({
                password: 'password123', // The beforeUpdate/beforeCreate hook will handle hashing if we use standard methods, but let's be safe
                role: 'super_admin'
            });
            console.log('Admin password reset successfully!');
        } else {
            await User.create({
                username: 'admin',
                password: 'password123',
                role: 'super_admin'
            });
            console.log('Admin user created successfully!');
        }
        
        console.log('Username: admin');
        console.log('Password: password123');
    } catch (error) {
        console.error('Error resetting admin:', error);
    } finally {
        await sequelize.close();
    }
}

resetAdmin();
