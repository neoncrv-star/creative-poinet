const { Sequelize } = require('sequelize');
require('dotenv').config();

let sequelize;

// تحقق إذا كنا في بيئة الإنتاج (Production)
if (process.env.NODE_ENV === 'production') {
    // استخدم إعدادات MySQL من متغيرات البيئة
    sequelize = new Sequelize(
        process.env.DB_NAME,
        process.env.DB_USER,
        process.env.DB_PASSWORD,
        {
            host: process.env.DB_HOST,
            dialect: 'mysql', // حددنا أننا نستخدم MySQL
            logging: false, // أوقف طباعة استعلامات SQL في اللوق
            pool: {
                max: 5,
                min: 0,
                acquire: 30000,
                idle: 10000
            }
        }
    );
} else {
    // في بيئة التطوير، استمر باستخدام SQLite
    const path = require('path');
    sequelize = new Sequelize({
        dialect: 'sqlite',
        storage: path.join(__dirname, '..', 'data', 'dev.sqlite'),
        logging: false
    });
}

// اختبار الاتصال
(async () => {
    try {
        await sequelize.authenticate();
        console.log('Database connection has been established successfully.');
    } catch (error) {
        console.error('Unable to connect to the database:', error);
    }
})();

module.exports = sequelize;