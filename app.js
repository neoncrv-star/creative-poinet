const express = require('express');
const path = require('path');
const fs = require('fs');
const logFile = path.join(__dirname, 'debug.log');
const debugLog = (msg) => {
    try {
        fs.appendFileSync(logFile, `[${new Date().toISOString()}] ${msg}\n`);
    } catch (e) {
        console.error('Logging error:', e);
    }
};

const loadEnv = () => {
    const isProd = (process.env.NODE_ENV || '').toLowerCase() === 'production';
    const candidates = isProd
        ? [
            path.join(__dirname, '.env.prod'),
            path.join(__dirname, '.env')
        ]
        : [
            path.join(__dirname, '.env'),
            path.join(__dirname, '.env.prod')
        ];
    const legacy = [
        '/home/u494530316/domains/cpoint-sa.com/public_html/.env.prod',
        '/home/u494530316/domains/cpoint-sa.com/public_html/.env'
    ];
    const envFiles = [...candidates, ...legacy];

    for (const file of envFiles) {
        if (fs.existsSync(file)) {
            require('dotenv').config({ path: file });
            debugLog(`Loaded environment from: ${file}`);
            console.log(`Loaded environment from: ${file}`);
            break;
        }
    }
};

loadEnv();

const session = require('express-session');
const FileStore = require('session-file-store')(session);
const compression = require('compression');
const sequelize = require('./config/database');

const app = express();
app.use(compression()); // Compress all responses
const APP_VERSION = process.env.APP_VERSION || '1.0.4';
app.locals.assetVersion = APP_VERSION.replace(/\s+/g, '');
console.log(`App version: ${APP_VERSION} - Performance Optimized`);

// Version header for deployment traceability
app.use((req, res, next) => {
    res.setHeader('X-App-Version', app.locals.assetVersion || 'unknown');
    next();
});

// Serve static files FIRST to avoid running middleware for assets
app.use(express.static(path.join(__dirname, 'public'), {
    maxAge: '1d', // Cache static assets for 1 day
    etag: true
}));

// Ensure necessary directories exist
['public/uploads', 'sessions'].forEach(dir => {
    const fullPath = path.join(__dirname, dir);
    if (!fs.existsSync(fullPath)) {
        fs.mkdirSync(fullPath, { recursive: true });
    }
});
const port = process.env.PORT || 3000;

// Session Config
const isProd = (process.env.NODE_ENV || '').toLowerCase() === 'production';
const trustProxy = Number(process.env.TRUST_PROXY || 1);
app.set('trust proxy', trustProxy);

const sessionDir = path.join(__dirname, 'sessions');
const cookieSecureEnv = (process.env.COOKIE_SECURE || '').toLowerCase();
const cookieSecure = cookieSecureEnv ? cookieSecureEnv === 'true' : isProd;
const sameSiteEnv = (process.env.SAME_SITE || '').toLowerCase();
const sameSite = sameSiteEnv || 'lax';

const cookieOptions = {
    maxAge: 3600000 * 24 * 7,
    secure: cookieSecure,
    httpOnly: true,
    sameSite
};
if (process.env.COOKIE_DOMAIN) {
    cookieOptions.domain = process.env.COOKIE_DOMAIN;
}

app.use(session({
    store: new FileStore({
        path: sessionDir,
        retries: 5,
        fileExtension: '.json',
        ttl: 86400 * 7,
        reapInterval: 3600
    }),
    secret: process.env.SESSION_SECRET || 'creative_point_secret_key',
    resave: true,
    saveUninitialized: false,
    name: process.env.SESSION_NAME || 'creative_point_session',
    cookie: cookieOptions
}));

// Import Routes
const mainRoutes = require('./routes/index');
const adminRoutes = require('./routes/admin');

// Global Data Middleware with Simple Cache
const GlobalSeo = require('./models/GlobalSeo');
const Category = require('./models/Category');

let globalDataCache = {
    seo: null,
    categories: [],
    lastFetch: 0
};
const CACHE_TTL = 60 * 5 * 1000; // 5 minutes cache

app.use(async (req, res, next) => {
    // Skip for static-like paths just in case (though static middleware is now above)
    if (req.path.match(/\.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2)$/)) {
        return next();
    }

    try {
        const now = Date.now();
        if (!globalDataCache.seo || (now - globalDataCache.lastFetch) > CACHE_TTL) {
            const [seo, categories] = await Promise.all([
                GlobalSeo.findOne(),
                Category.findAll({ order: [['display_order', 'ASC']] })
            ]);
            globalDataCache = {
                seo,
                categories,
                lastFetch: now
            };
        }
        
        res.locals.globalSeo = globalDataCache.seo;
        res.locals.globalCategories = globalDataCache.categories;
        res.locals.path = req.path;
        next();
    } catch (error) {
        console.error('Global Data Middleware Error:', error);
        res.locals.globalSeo = null;
        res.locals.globalCategories = [];
        res.locals.path = req.path;
        next();
    }
});

// Set view engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Parse body
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Use Routes
app.use('/admin', adminRoutes);
app.use('/', mainRoutes);

// Sync Database & Start server
const syncOptions = {
    alter: (process.env.DB_SYNC_ALTER || '').toLowerCase() === 'true' || process.env.NODE_ENV === 'development',
    force: (process.env.DB_SYNC_FORCE || 'false').toLowerCase() === 'true'
};

sequelize.sync(syncOptions)
    .then(async () => {
        const msg = `Database synced successfully (MySQL)`;
        debugLog(msg);
        console.log(msg);
        app.listen(port, () => {
            const startMsg = `Server is running at http://localhost:${port}`;
            debugLog(startMsg);
            console.log(startMsg);
        });
    })
    .catch(err => {
        const errMsg = `Critical Database sync error: ${err.message}`;
        debugLog(errMsg);
        console.error(errMsg, err);
        process.exit(1); // Exit if database connection fails in mandatory MySQL mode
    });
