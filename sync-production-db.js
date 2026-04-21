/**
 * sync-production-db.js
 * يزامن جميع الجداول مع MySQL في بيئة الإنتاج
 * الاستخدام: NODE_ENV=production node sync-production-db.js
 */

process.env.NODE_ENV = 'production';

// تحميل متغيرات البيئة
require('dotenv').config({ path: require('path').join(__dirname, 'backend', '.env.prod') });

const sequelize = require('./backend/config/database');

// استيراد جميع الموديلات
const User        = require('./backend/models/User');
const GlobalSeo   = require('./backend/models/GlobalSeo');
const Service     = require('./backend/models/Service');
const Partner     = require('./backend/models/Partner');
const Project     = require('./backend/models/Project');
const Post        = require('./backend/models/Post');
const Category    = require('./backend/models/Category');
const Contact     = require('./backend/models/Contact');
const StatBlock   = require('./backend/models/StatBlock');
const Philosophy  = require('./backend/models/Philosophy');

const models = {
    User, GlobalSeo, Service, Partner,
    Project, Post, Category, Contact,
    StatBlock, Philosophy
};

(async () => {
    console.log('\n🔄 Connecting to MySQL...');
    try {
        await sequelize.authenticate();
        console.log('✅ Connected successfully.\n');
    } catch (e) {
        console.error('❌ Connection failed:', e.message);
        process.exit(1);
    }

    console.log('📋 Checking tables...\n');

    // عرض الجداول الموجودة حالياً
    const [existing] = await sequelize.query('SHOW TABLES');
    const existingNames = existing.map(r => Object.values(r)[0].toLowerCase());
    console.log('Existing tables:', existingNames.join(', ') || 'none');
    console.log('');

    // مزامنة كل موديل على حدة مع تقرير مفصل
    for (const [name, model] of Object.entries(models)) {
        try {
            await model.sync({ alter: true });
            console.log(`✅ ${name} — synced`);
        } catch (e) {
            console.error(`❌ ${name} — FAILED: ${e.message}`);
        }
    }

    // التحقق النهائي
    const [after] = await sequelize.query('SHOW TABLES');
    const afterNames = after.map(r => Object.values(r)[0]);
    console.log('\n📊 Tables after sync:', afterNames.join(', '));
    console.log('\n✅ Done. You can now restart the app.\n');
    process.exit(0);
})();