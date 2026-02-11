const sequelize = require('./config/database');
const User = require('./models/User');
const bcrypt = require('bcryptjs');

async function forceReset() {
    try {
        await sequelize.authenticate();
        console.log('Connected to database.');

        // 1. Delete existing admin
        await User.destroy({ where: { username: 'admin' } });
        console.log('Old admin deleted.');

        // 2. Create new admin with manual hash to be 100% sure
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash('password123', salt);

        await User.create({
            username: 'admin',
            password: hashedPassword, // The beforeCreate hook might hash it again, let's check
            role: 'super_admin'
        });

        // Let's verify what was saved
        const newUser = await User.findOne({ where: { username: 'admin' } });
        const isMatch = await bcrypt.compare('password123', newUser.password);
        
        console.log('Admin user recreated.');
        console.log('Verification match:', isMatch);
        console.log('Hash in DB:', newUser.password);

        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

forceReset();
