const express = require('express');
const path = require('path');
const fs = require('fs');
const os = require('os');
const { monitorEventLoopDelay } = require('perf_hooks');
const session = require('express-session');
const FileStore = require('session-file-store')(session);
const compression = require('compression');

// استدعاء إعدادات قاعدة البيانات والخدمات
const sequelize = require('./config/database');
const storageService = require('./src/storage/storage.service');

const app = express();

// 🚀 إعدادات هوستنجر الأساسية (Reverse Proxy)
app.set('trust proxy', 1);
app.disable('x-powered-by');
app.set('etag', 'strong');

// ضغط الملفات لتسريع الاستجابة
app.use(compression({ level: 6, threshold: 1024 }));

const isProdEnv = (process.env.NODE_ENV || '').toLowerCase() === 'production';
app.locals.assetVersion = process.env.APP_VERSION || '2.0.1';
app.locals.bootTime = Date.now();

// نظام تسجيل الأخطاء
const logFile = path.join(__dirname, 'debug.log');
const debugLog = (msg) => {
    if (isProdEnv && (process.env.ENABLE_DEBUG_LOG || '').toLowerCase() !== 'true') return;
    try { fs.appendFileSync(logFile, `[${new Date().toISOString()}] ${msg}\n`); } catch (e) { }
};

// ترويسات الأمان الأساسية
app.use((req, res, next) => {
    res.setHeader('X-App-Version', app.locals.assetVersion);
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'SAMEORIGIN');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    next();
});

// 📂 إعداد مسارات الملفات الثابتة والمرفقات
const uploadsDir = storageService.UPLOAD_PATH || path.join(__dirname, '..', 'frontend', 'public', 'uploads');
const publicDir = path.join(__dirname, '..', 'frontend', 'public');
const sessionsDir = path.join(__dirname, 'sessions');

[uploadsDir, sessionsDir].forEach(dir => {
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
});

app.use('/uploads', express.static(uploadsDir, { maxAge: '365d', etag: true }));
app.use(express.static(publicDir, { maxAge: '30d', etag: true }));

// 🔐 إعداد الجلسات (Sessions)
app.use(session({
    store: new FileStore({
        path: sessionsDir,
        retries: 2,
        fileExtension: '.json',
        ttl: 86400 * 7,
        reapInterval: 3600
    }),
    secret: process.env.SESSION_SECRET || 'hostinger_secure_secret_2024',
    resave: false,
    saveUninitialized: false,
    name: 'creative_session',
    cookie: {
        maxAge: 3600000 * 24 * 7,
        secure: isProdEnv,
        httpOnly: true,
        sameSite: 'lax'
    }
}));

// ⚙️ إعداد المحرك والقوالب
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, '..', 'frontend', 'views'));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// 🛡️ حماية ضد هجمات (Rate Limiting)
const ipHits = new Map();
const RATE_WINDOW_MS = 60000;
const RATE_MAX = 240;
app.use((req, res, next) => {
    const ip = req.ip || 'unknown';
    const arr = ipHits.get(ip) || [];
    const now = Date.now();
    const validHits = arr.filter(time => now - time < RATE_WINDOW_MS);
    validHits.push(now);
    ipHits.set(ip, validHits);
    if (validHits.length > RATE_MAX) return res.status(429).send('Too Many Requests');
    next();
});

// 🗄️ استدعاء النماذج (Models)
const GlobalSeo = require('./models/GlobalSeo');
const Category = require('./models/Category');
const ServiceModel = require('./models/Service');

// 🗃️ نظام التخزين المؤقت للبيانات العامة (Cache)
let globalDataCache = { seo: null, categories: [], lastFetch: 0 };
app.use(async (req, res, next) => {
    if (req.path.match(/\.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2)$/)) return next();

    try {
        const now = Date.now();
        if (!globalDataCache.seo || (now - globalDataCache.lastFetch) > 300000) {
            const [seo, categories] = await Promise.all([
                GlobalSeo.findOne(),
                Category.findAll({ order: [['display_order', 'ASC']] })
            ]);
            globalDataCache = { seo, categories, lastFetch: now };
        }
        res.locals.globalSeo = globalDataCache.seo;
        res.locals.globalCategories = globalDataCache.categories;
        res.locals.path = req.path;

        // 🛑 [الحل الجذري للصور المكسورة]: معالجة ذكية لمسار الصور
        res.locals.assetPath = (val) => {
            if (!val) return '';
            if (val.startsWith('http://') || val.startsWith('https://')) return val;
            
            let cleanPath = val.replace(/^\/+/, '');
            
            // إذا كان اسم ملف فقط (بدون مجلد) مثل 1770809046285.png
            if (!cleanPath.includes('/')) {
                return '/uploads/' + cleanPath;
            }
            
            // إذا كان يحتوي على مسار بالفعل
            if (cleanPath.startsWith('uploads/')) {
                return '/' + cleanPath;
            }
            
            return '/' + cleanPath;
        };
        next();
    } catch (error) {
        debugLog('Global Data Error: ' + error.message);
        res.locals.globalSeo = null;
        res.locals.globalCategories = [];
        res.locals.path = req.path;
        next();
    }
});

// 🛣️ المسارات (Routes)
app.use('/admin', require('./routes/admin'));
app.use('/', require('./routes/index'));

// 🩺 فحص صحة الخادم (Health Check)
app.get('/healthz', (req, res) => res.json({ status: 'ok', version: app.locals.assetVersion }));

// 🛑 معالجة الأخطاء غير المتوقعة
process.on('unhandledRejection', (reason) => debugLog(`Unhandled Rejection: ${reason}`));
process.on('uncaughtException', (err) => {
    debugLog(`Uncaught Exception: ${err.message}`);
    console.error(err);
    setTimeout(() => process.exit(1), 1000);
});

// 🛠️ معالجة أخطاء القوالب المفقودة
app.use((err, req, res, next) => {
    if (err.message && err.message.includes('Failed to lookup view')) {
        debugLog(`❌ View Error: ${err.message}. Check your filenames in frontend/views/`);
    }
    if (isProdEnv) {
        return res.status(500).send('Internal Server Error');
    }
    next(err);
});

// 🔌 تشغيل الخادم
const port = process.env.PORT || 3000;
const server = app.listen(port, () => {
    console.log(`🚀 Server running on port ${port}`);
});
server.keepAliveTimeout = 65000;
server.headersTimeout = 70000;

// 🗄️ الاتصال بقاعدة البيانات
async function initDatabase() {
    let connected = false;
    for (let i = 0; i < 5; i++) {
        try {
            await sequelize.authenticate();
            console.log('✅ MySQL Connected Successfully.');
            connected = true;
            break;
        } catch (err) {
            console.error(`⚠️ DB Connection Failed:`, err.message);
            await new Promise(res => setTimeout(res, 3000));
        }
    }
    if (!connected) return;

    require('./models/Project');
    require('./models/Post');
    require('./models/Partner');
    require('./models/StatBlock');
    require('./models/User');
    require('./models/Contact');

    try {
        await sequelize.sync({ alter: true });
        console.log('✅ All Database Tables Synced Successfully.');
    } catch (e) {
        console.error('Sync Warning: ' + e.message);
    }
}
initDatabase();

module.exports = app;