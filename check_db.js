const Service = require('./models/Service');
const Partner = require('./models/Partner');
const User = require('./models/User');
const sequelize = require('./config/database');

async function check() {
    try {
        const sCount = await Service.count();
        const pCount = await Partner.count();
        const uCount = await User.count();
        console.log(`Services: ${sCount}`);
        console.log(`Partners: ${pCount}`);
        console.log(`Users: ${uCount}`);
    } catch (e) {
        console.error(e);
    } finally {
        await sequelize.close();
    }
}
check();
