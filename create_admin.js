const User = require('./models/User');
const sequelize = require('./config/database');

async function createAdmin() {
    try {
        await sequelize.sync({ alter: true });
        
        // Check if admin already exists
        const adminExists = await User.findOne({ where: { username: 'admin' } });
        
        if (!adminExists) {
            await User.create({
                username: 'admin',
                password: 'password123',
                role: 'super_admin'
            });
            console.log('Admin user created successfully!');
            console.log('Username: admin');
            console.log('Password: password123');
        } else {
            console.log('Admin user already exists.');
        }
    } catch (error) {
        console.error('Error creating admin:', error);
    } finally {
        await sequelize.close();
    }
}

createAdmin();
