const { Sequelize } = require('sequelize');
const fs = require('fs');
const path = require('path');

// تحميل المتغيرات محلياً إن وجدت، وبدون إيقاف الخادم في هوستنجر
require('dotenv').config();

// التحقق من متغيرات هوستنجر الأساسية فقط إذا كان النوع MySQL
const dialect = (process.env.DB_DIALECT || 'mysql').toLowerCase();
    
if (dialect === 'mysql') {
    if (!process.env.DB_NAME || !process.env.DB_HOST || !process.env.DB_USER) {
        const missing = [];
        if (!process.env.DB_NAME) missing.push('DB_NAME');
        if (!process.env.DB_HOST) missing.push('DB_HOST');
        if (!process.env.DB_USER) missing.push('DB_USER');
        console.error(`❌ Missing MySQL environment variables: ${missing.join(', ')}. Server stopped.`);
        process.exit(1);
    }  
}

// تشخيص أولي للاتصال في السجلات لجعل الحل جذرياً
const maskVal = (val) => val ? (val.substring(0, 2) + '***' + val.substring(val.length - 1)) : 'empty';
console.log(`🔍 DB Diagnostic: Host=${process.env.DB_HOST}, User=${maskVal(process.env.DB_USER)}, Name=${process.env.DB_NAME}, Port=${process.env.DB_PORT || 3306}`);

const SLOW_DB_MS = Number(process.env.SLOW_DB_MS || 300);

// نظام تسجيل الأخطاء والبطء متوافق مع متغيراتك
const dbLogger = (msg, time) => {
    try {
        if (typeof time === 'number' && time >= SLOW_DB_MS) {
            const logFile = path.join(__dirname, '..', 'debug.log');
            fs.appendFileSync(logFile, `[${new Date().toISOString()}] SLOW-DB ${time}ms ${msg}\n`);
        }
    } catch { }
    if ((process.env.ENABLE_DEBUG_LOG || 'false').toLowerCase() === 'true') {
        console.log(msg, typeof time === 'number' ? `${time}ms` : '');
    }
};

// إضافة دعم لـ SQLite و MySQL
const config = {
    dialect: dialect,
    logging: dbLogger,
    benchmark: true,
    define: {
        charset: 'utf8mb4',
        collate: 'utf8mb4_unicode_ci',
        timestamps: true
    }
};

if (dialect === 'sqlite') {
    let storagePath = process.env.DB_STORAGE || 'data/database.sqlite';
    if (!path.isAbsolute(storagePath)) {
        storagePath = path.join(__dirname, '..', storagePath);
    }
    config.storage = storagePath;
} else {
    config.timezone = '+03:00';
    config.host = process.env.DB_HOST || '127.0.0.1';
    config.port = Number(process.env.DB_PORT || 3306);
    config.pool = {
        max: Number(process.env.DB_POOL_MAX || 10),
        min: Number(process.env.DB_POOL_MIN || 2),
        idle: Number(process.env.DB_POOL_IDLE || 10000),
        acquire: Number(process.env.DB_CONNECT_TIMEOUT || 30000)
    };
    config.retry = {
        max: Number(process.env.DB_RETRY_MAX || 1)
    };
    config.dialectOptions = {
        connectTimeout: Number(process.env.DB_CONNECT_TIMEOUT || 10000),
        charset: 'utf8mb4'
    };
}

const sequelize = new Sequelize(
    dialect === 'mysql' ? process.env.DB_NAME : { dialect: 'sqlite' },
    dialect === 'mysql' ? process.env.DB_USER : null,
    dialect === 'mysql' ? process.env.DB_PASSWORD || '' : null,
    config
);

module.exports = sequelize;
