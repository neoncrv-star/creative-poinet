const express = require('express');
const path = require('path');
const fs = require('fs');
const childProcess = require('child_process');
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
    const envProd = path.join(__dirname, '.env.prod');
    const envDev = path.join(__dirname, '.env');
    const legacy = [
        '/home/u494530316/domains/cpoint-sa.com/public_html/.env.prod',
        '/home/u494530316/domains/cpoint-sa.com/public_html/.env'
    ];
    const ordered = [];
    if (isProd) {
        if (fs.existsSync(envProd)) ordered.push(envProd);
        if (fs.existsSync(envDev)) ordered.push(envDev);
    } else {
        if (fs.existsSync(envDev)) ordered.push(envDev);
        // If no .env exists locally but .env.prod is present (e.g., misconfigured prod), load it
        if (!fs.existsSync(envDev) && fs.existsSync(envProd)) ordered.push(envProd);
    }
    legacy.forEach(f => ordered.push(f));
    for (const file of ordered) {
        try {
            if (fs.existsSync(file)) {
                require('dotenv').config({ path: file, override: true });
                debugLog(`Loaded environment from: ${file}`);
                console.log(`Loaded environment from: ${file}`);
                // Stop after first real file in project root
                if (file === envProd || file === envDev) break;
            }
        } catch {}
    }
};

loadEnv();

const session = require('express-session');
const FileStore = require('session-file-store')(session);
const compression = require('compression');
const sequelize = require('./config/database');

const app = express();
app.disable('x-powered-by');
app.set('etag', 'strong');
app.use(compression({ level: 6, threshold: 1024 })); // Compress responses efficiently
let computedVersion = process.env.APP_VERSION;
if (!computedVersion) {
    try {
        computedVersion = childProcess.execSync('git rev-parse --short HEAD').toString().trim();
    } catch (e) {
        computedVersion = String(Date.now());
    }
}
app.locals.assetVersion = computedVersion.replace(/\s+/g, '');
console.log(`App version: ${app.locals.assetVersion} - Performance Optimized`);
app.locals.bootTime = Date.now();

// Version header for deployment traceability
app.use((req, res, next) => {
    res.setHeader('X-App-Version', app.locals.assetVersion || 'unknown');
    const accept = (req.headers.accept || '').toLowerCase();
    if (accept.includes('text/html')) {
        res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
        res.setHeader('Pragma', 'no-cache');
        res.setHeader('Expires', '0');
        const windowMs = Number(process.env.CLEAR_SITE_DATA_WINDOW_MS || 3 * 60 * 1000);
        if (Date.now() - (app.locals.bootTime || 0) < windowMs) {
            // In the first minutes after deploy, ask browsers to clear cached resources
            res.setHeader('Clear-Site-Data', '"cache"');
        }
    }
    next();
});

// Robust uploads serving with fallback (before static)
app.use('/uploads', (req, res, next) => {
    try {
        const reqPath = decodeURIComponent(req.path || '');
        const uploadsDir = path.join(__dirname, 'public', 'uploads');
        const filePath = path.join(uploadsDir, reqPath);
        if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
            res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
            return res.sendFile(filePath);
        }
        // Self-heal: if requested extension missing but another variant exists, serve it
        const basename = path.basename(reqPath, path.extname(reqPath));
        if (basename) {
            const candidates = ['.webp','.png','.jpg','.jpeg','.gif','.avif','.svg','.jfif'];
            for (const ext of candidates) {
                const alt = path.join(uploadsDir, basename + ext);
                if (fs.existsSync(alt) && fs.statSync(alt).isFile()) {
                    debugLog(`UPLOADS HEAL: ${reqPath} -> ${basename + ext}`);
                    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
                    return res.sendFile(alt);
                }
            }
        }
        // Fallback: admin sees visible red placeholder; public gets transparent pixel
        const ref = (req.get('referer') || '').toLowerCase();
        const isAdminCtx = ref.includes('/admin') || req.query.admin === '1';
        if (isAdminCtx) {
            debugLog(`UPLOADS MISSING(ADMIN): ${reqPath} -> visible placeholder`);
            const svg = Buffer.from(
                `<svg xmlns="http://www.w3.org/2000/svg" width="120" height="120">
                    <rect width="120" height="120" fill="#fff"/>
                    <rect width="120" height="120" fill="url(#p)"/>
                    <defs><pattern id="p" width="8" height="8" patternUnits="userSpaceOnUse">
                        <path d="M0,0 L8,8 M8,0 L0,8" stroke="#D00000" stroke-width="2"/>
                    </pattern></defs>
                    <text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="#D00000" font-family="Arial" font-size="12">MISSING</text>
                </svg>`
            );
            res.setHeader('Content-Type', 'image/svg+xml');
            res.setHeader('Cache-Control', 'no-cache');
            return res.end(svg);
        } else {
            // Transparent pixel for public to prevent layout jumps/spinners
            debugLog(`UPLOADS MISSING: ${reqPath} -> serving tiny placeholder`);
            const transparentPng = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR4nGNgYAAAAAMAASsJTYQAAAAASUVORK5CYII=', 'base64');
            res.setHeader('Content-Type', 'image/png');
            res.setHeader('Cache-Control', 'public, max-age=60, stale-while-revalidate=600');
            return res.end(transparentPng);
        }
    } catch (e) {
        return next();
    }
});

// Serve static files FIRST to avoid running middleware for assets (after uploads fallback)
app.use(express.static(path.join(__dirname, 'public'), {
    maxAge: '30d',
    etag: true,
    setHeaders: (res, filePath) => {
        const ext = path.extname(filePath).toLowerCase();
        const longCache = ['.js', '.css', '.png', '.jpg', '.jpeg', '.gif', '.svg', '.webp', '.ico', '.woff', '.woff2', '.ttf', '.otf', '.mp4', '.webm'];
        if (longCache.includes(ext)) {
            res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
        }
    }
}));

// Simple health endpoint to verify deployed version and dialect
app.get('/healthz', (req, res) => {
    try {
        const info = {
            status: 'ok',
            version: app.locals.assetVersion || 'unknown',
            dialect: (sequelize && sequelize.getDialect && sequelize.getDialect()) || 'unknown',
            time: new Date().toISOString()
        };
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('X-App-Version', info.version);
        res.setHeader('X-Robots-Tag', 'noindex');
        res.end(JSON.stringify(info));
    } catch (e) {
        res.status(500).json({ status: 'error' });
    }
});

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

app.use((req, res, next) => {
    // Guard against long-hanging responses (defensive)
    res.setTimeout(Number(process.env.REQ_TIMEOUT_MS || 15000), () => {
        try {
            res.status(504).send('Request timeout');
        } catch {}
    });
    next();
});

app.use(async (req, res, next) => {
    // Skip for static-like paths just in case (though static middleware is now above)
    if (req.path.match(/\.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2)$/)) {
        return next();
    }

    try {
        const now = Date.now();
        const needRefresh = !globalDataCache.seo || (now - globalDataCache.lastFetch) > CACHE_TTL;
        if (needRefresh) {
            const timeoutMs = Number(process.env.GLOBAL_DATA_TIMEOUT_MS || 1500);
            const fetchPromise = Promise.all([
                GlobalSeo.findOne(),
                Category.findAll({ order: [['display_order', 'ASC']] })
            ]).then(([seo, categories]) => {
                globalDataCache = { seo, categories, lastFetch: Date.now() };
            });
            const timeoutPromise = new Promise((resolve) => setTimeout(resolve, timeoutMs));
            await Promise.race([fetchPromise, timeoutPromise]);
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
        const errMsg = `Database sync error (degraded mode): ${err.message}`;
        debugLog(errMsg);
        console.error(errMsg, err);
        // Start server in degraded mode to avoid downtime; pages will fallback where possible
        app.listen(port, () => {
            const startMsg = `Server (degraded) running at http://localhost:${port}`;
            debugLog(startMsg);
            console.log(startMsg);
        });
    });
