// require('dotenv').config();
process.env.DB_NAME = ''; // force sqlite
const sequelize = require('./config/database');
const User = require('./models/User');

async function checkUser() {
    try {
        await sequelize.authenticate();
        console.log('Database connected successfully.');
        const users = await User.findAll();
        console.log('Total users found:', users.length);
        users.forEach(u => {
            console.log(`Username: ${u.username}, Role: ${u.role}`);
        });
    } catch (error) {
        console.error('Unable to connect to database or query users:', error);
    } finally {
        await sequelize.close();
    }
}

checkUser();
