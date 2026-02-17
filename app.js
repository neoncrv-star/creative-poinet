const express = require('express');
const path = require('path');
const fs = require('fs');
const childProcess = require('child_process');
const os = require('os');
const { monitorEventLoopDelay } = require('perf_hooks');

const isProdEnv = (process.env.NODE_ENV || '').toLowerCase() === 'production';

const logFile = path.join(__dirname, 'debug.log');
const debugLog = (msg) => {
    if (isProdEnv && (process.env.ENABLE_DEBUG_LOG || '').toLowerCase() !== 'true') {
        return;
    }
    try {
        fs.appendFileSync(logFile, `[${new Date().toISOString()}] ${msg}\n`);
    } catch (e) {
        console.error('Logging error:', e);
    }
};

// Event loop delay monitor (useful to diagnose event-loop stalls)
let evLoopMonitor;
try {
    if (!isProdEnv || (process.env.ENABLE_EVENTLOOP_MONITOR || '').toLowerCase() === 'true') {
        evLoopMonitor = monitorEventLoopDelay({ resolution: 20 });
        evLoopMonitor.enable();
        debugLog('EventLoopDelay monitor enabled');
    } else {
        evLoopMonitor = null;
    }
} catch (e) {
    evLoopMonitor = null;
    debugLog(`EventLoopDelay monitor not available: ${e.message}`);
}

// Small helper to tail the debug.log (best-effort)
const tailDebugLog = (lines = 30) => {
    try {
        if (!fs.existsSync(logFile)) return '';
        const content = fs.readFileSync(logFile, 'utf8');
        const arr = content.trim().split(/\r?\n/);
        const start = Math.max(0, arr.length - lines);
        return arr.slice(start).join('\n');
    } catch (e) {
        return `tail error: ${e.message}`;
    }
};

const session = require('express-session');
const FileStore = require('session-file-store')(session);
const compression = require('compression');
const sequelize = require('./config/database');
const storageService = require('./src/storage/storage.service');

const app = express();
app.disable('x-powered-by');
app.set('etag', 'strong');
app.use(compression({ level: 6, threshold: 1024 })); // Compress responses efficiently
let computedVersion = process.env.APP_VERSION;
if (!computedVersion) {
    try {
        const baseHash = childProcess.execSync('git rev-parse --short HEAD').toString().trim();
        let dirtySuffix = '';
        try {
            const status = childProcess.execSync('git status --porcelain').toString().trim();
            if (status) {
                dirtySuffix = '-' + Date.now().toString(36);
            }
        } catch {}
        computedVersion = (baseHash + dirtySuffix) || String(Date.now());
    } catch (e) {
        computedVersion = String(Date.now());
    }
}
app.locals.assetVersion = (computedVersion || '').toString().replace(/\s+/g, '');
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

// Serve uploads from persistent path if configured, then apply fallback/self-heal
app.use('/uploads', express.static(storageService.UPLOAD_PATH, {
    maxAge: '365d',
    etag: true
}));

app.use('/uploads', (req, res, next) => {
    try {
        const reqPath = decodeURIComponent(req.path || '');
        const uploadsDir = storageService.UPLOAD_PATH;
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

// Serve hashed-name assets from /uploads even if path misses the prefix
app.use((req, res, next) => {
    try {
        const p = req.path || '';
        const m = p.match(/^\/([a-f0-9]{16,64})\.(webp|png|jpg|jpeg|gif|avif|svg|jfif)$/i);
        if (!m) return next();
        const uploadsDir = storageService.UPLOAD_PATH;
        const filePath = path.join(uploadsDir, `${m[1]}.${m[2].toLowerCase()}`);
        if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
            res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
            return res.sendFile(filePath);
        }
        return next();
    } catch {
        return next();
    }
});


// Dedicated route for preloader spinner asset (stored under /views)
app.get('/preloader-spinner.png', (req, res) => {
    try {
        const imgPath = path.join(__dirname, 'views', '4433444.png');
        return res.sendFile(imgPath);
    } catch (e) {
        return res.status(404).end();
    }
});

// Serve static files FIRST to avoid running middleware for assets (after uploads handling)
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

app.get('/health/db', async (req, res) => {
    const start = process.hrtime.bigint();
    let active = null;
    let idle = null;
    try {
        await sequelize.authenticate();
        const latencyMs = Number((process.hrtime.bigint() - start) / 1000000n);
        try {
            if (sequelize && sequelize.connectionManager && sequelize.connectionManager.pool) {
                const pool = sequelize.connectionManager.pool;
                if (typeof pool.borrowed === 'function') {
                    active = pool.borrowed();
                } else if (typeof pool.used === 'number') {
                    active = pool.used;
                }
                if (typeof pool.available === 'function') {
                    idle = pool.available();
                } else if (typeof pool.free === 'number') {
                    idle = pool.free;
                }
            }
        } catch (e) {
            debugLog('DB health pool read error: ' + (e && e.message));
        }
        const payload = {
            status: 'ok',
            latency: `${latencyMs} ms`,
            pool: { active, idle }
        };
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('X-Robots-Tag', 'noindex');
        res.status(200).json(payload);
    } catch (err) {
        const latencyMs = Number((process.hrtime.bigint() - start) / 1000000n);
        const msg = `DB health check failed: ${err && err.message}`;
        debugLog(msg);
        console.error(msg);
        res.status(500).json({
            status: 'error',
            latency: `${latencyMs} ms`,
            pool: { active: null, idle: null }
        });
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
const allowStartWithoutDb = (process.env.ALLOW_START_WITHOUT_DB || '').toLowerCase() === 'true' && !isProd;
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
const ServiceModel = require('./models/Service');
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


// Helper to gather runtime diagnostics (best-effort)
const gatherDiagnostics = (req, durMs) => {
    try {
        const mem = process.memoryUsage();
        const load = os.loadavg();
        const uptime = process.uptime();
        const activeHandles = (() => {
            try { return process._getActiveHandles ? process._getActiveHandles().length : 'n/a'; } catch (e) { return 'err'; }
        })();
        const activeRequests = (() => {
            try { return process._getActiveRequests ? process._getActiveRequests().length : 'n/a'; } catch (e) { return 'err'; }
        })();
        const ev = evLoopMonitor ? {
            minMs: Number(evLoopMonitor.min) / 1e6,
            maxMs: Number(evLoopMonitor.max) / 1e6,
            meanMs: Number(evLoopMonitor.mean) / 1e6,
            stddevMs: Number(evLoopMonitor.stddev) / 1e6,
            percentiles: {
                p50: Number(evLoopMonitor.percentile(50)) / 1e6,
                p75: Number(evLoopMonitor.percentile(75)) / 1e6,
                p95: Number(evLoopMonitor.percentile(95)) / 1e6,
                p99: Number(evLoopMonitor.percentile(99)) / 1e6
            }
        } : null;

        // Try to extract pool info from sequelize (best-effort)
        let dbPoolInfo = 'n/a';
        try {
            if (sequelize && sequelize.connectionManager && sequelize.connectionManager.pool) {
                const pool = sequelize.connectionManager.pool;
                dbPoolInfo = {
                    // Generic-pool-ish fields if present
                    max: pool.max || pool.size || null,
                    min: pool.min || null,
                    borrowed: typeof pool.borrowed === 'function' ? pool.borrowed() : (pool.used ? pool.used : 'n/a')
                };
            }
        } catch (e) {
            dbPoolInfo = `error reading pool: ${e.message}`;
        }

        const lastLogs = tailDebugLog(80);

        const diag = {
            time: new Date().toISOString(),
            url: req.originalUrl,
            method: req.method,
            durationMs: durMs,
            mem,
            load,
            uptimeSeconds: Math.round(uptime),
            activeHandles,
            activeRequests,
            eventLoop: ev,
            dbPoolInfo,
            lastLogsSnippet: lastLogs
        };
        return JSON.stringify(diag, null, 2);
    } catch (e) {
        return `gatherDiagnostics failed: ${e && e.message}`;
    }
};


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
            }).catch(e => {
                debugLog('Global data fetch error: ' + (e && e.message));
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

// Asset path helper for views
app.use((req, res, next) => {
    res.locals.assetPath = (value) => {
        try {
            if (!value) return value;
            const v = String(value).trim();

            if (/^https?:\/\//i.test(v)) {
                try {
                    const url = new URL(v);
                    const pathname = url.pathname || '';
                    const idx = pathname.lastIndexOf('/uploads/');
                    if (idx !== -1) {
                        const filename = pathname.substring(idx + '/uploads/'.length).replace(/^\/+/, '');
                        const m = filename.match(/^([a-f0-9]{16,64})\.(webp|png|jpg|jpeg|gif|avif|svg|jfif)$/i);
                        if (m) return `/uploads/${m[1]}.${m[2].toLowerCase()}`;
                        return `/uploads/${filename}`;
                    }
                } catch {
                }
                return v;
            }

            if (/^data:/i.test(v)) return v;

            const fixed = v.replace(/\/{2,}/g, '/');
            if (fixed.startsWith('/uploads/')) return fixed;
            if (fixed.startsWith('uploads/')) return '/' + fixed;
            const m = fixed.match(/^([a-f0-9]{16,64})\.(webp|png|jpg|jpeg|gif|avif|svg|jfif)$/i);
            if (m) return `/uploads/${m[1]}.${m[2].toLowerCase()}`;
            if (!fixed.startsWith('/')) return '/' + fixed;
            return fixed;
        } catch {
            return value;
        }
    };
    next();
});

// Minimal security headers (no extra deps)
app.use((req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'SAMEORIGIN');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    res.setHeader('Permissions-Policy', 'geolocation=(), camera=(), microphone=()');
    next();
});

// Lightweight in-memory rate limiting per IP (sliding window)
const ipHits = new Map(); // ip -> array of timestamps(ms)
const RATE_WINDOW_MS = Number(process.env.RATE_LIMIT_WINDOW_MS || 60_000);
const RATE_MAX = Number(process.env.RATE_LIMIT_MAX || 240); // 240req/دقيقة/IP
const limitPaths = [/^\/admin\b/, /^\/contact\b/, /^\/api\b/, /^\/blog\b/, /^\/portfolio\b/, /^\/en\/(blog|portfolio)\b/];
app.use((req, res, next) => {
    try {
        const p = req.path || '/';
        if (!limitPaths.some(rx => rx.test(p))) return next();
        const now = Date.now();
        const ip = (req.ip || req.connection?.remoteAddress || 'unknown').slice(0, 64);
        const arr = ipHits.get(ip) || [];
        const cutoff = now - RATE_WINDOW_MS;
        let i = 0;
        while (i < arr.length && arr[i] < cutoff) i++;
        if (i > 0) arr.splice(0, i);
        arr.push(now);
        ipHits.set(ip, arr);
        if (arr.length > RATE_MAX) {
            res.setHeader('Retry-After', String(Math.ceil(RATE_WINDOW_MS / 1000)));
            return res.status(429).send('Too Many Requests');
        }
        next();
    } catch {
        next();
    }
});

// Slow request logger + 5s diagnostic trigger
app.use((req, res, next) => {
    const start = process.hrtime.bigint();
    const slowMs = Number(process.env.SLOW_REQ_MS || 1000);
    res.on('finish', () => {
        try {
            const durMs = Number((process.hrtime.bigint() - start) / 1000000n);
            if (durMs >= slowMs) {
                debugLog(`SLOW ${req.method} ${req.originalUrl} ${res.statusCode} ${durMs}ms`);
            }
            // If duration crosses the 5 second threshold, gather diagnostics and print to console + debug.log
            const diagThreshold = Number(process.env.DIAG_THRESHOLD_MS || 5000);
            if (durMs >= diagThreshold) {
                const diag = gatherDiagnostics(req, durMs);
                const marker = `\n===== SLOW-REQUEST DIAGNOSTIC (${durMs}ms >= ${diagThreshold}ms) =====\n`;
                console.error(marker + diag + '\n===== END DIAGNOSTIC =====\n');
                debugLog(`DIAGNOSTIC_FOR_${req.method}_${req.originalUrl}: ${diag}`);
            }
        } catch (e) {
            console.error('Slow logger error:', e);
        }
    });
    next();
});

// Use Routes
app.use('/admin', adminRoutes);
app.use('/', mainRoutes);

// Global unhandled rejections / exceptions to prevent silent crashes
process.on('unhandledRejection', (reason, p) => {
    try {
        const msg = `unhandledRejection: ${reason && (reason.stack || reason.toString())}`;
        console.error(msg);
        debugLog(msg);
    } catch {}
});
process.on('uncaughtException', (err) => {
    try {
        const msg = `uncaughtException: ${err && (err.stack || err.toString())}`;
        console.error(msg);
        debugLog(msg);
        // Attempt graceful shutdown if critical (do not exit immediately if PM2 or systemd will restart)
        // setTimeout(() => process.exit(1), 5000);
    } catch {}
});

// Sync Database & Start server
const syncOptions = {
    alter: (process.env.DB_SYNC_ALTER || '').toLowerCase() === 'true' || process.env.NODE_ENV === 'development',
    force: (process.env.DB_SYNC_FORCE || 'false').toLowerCase() === 'true'
};

async function ensureMySQLConnection(retries = 10) {
    for (let i = 0; i < retries; i++) {
        try {
            const t0 = process.hrtime.bigint();
            await sequelize.authenticate();
            const latencyMs = Number((process.hrtime.bigint() - t0) / 1000000n);
            const dialect = (sequelize && sequelize.getDialect && sequelize.getDialect()) || 'unknown';
            const info = {
                host: process.env.DB_HOST,
                name: process.env.DB_NAME,
                dialect,
                latency: `${latencyMs} ms`
            };
            const msg = `✅ MySQL connection established in ${latencyMs}ms`;
            debugLog(`${msg} host=${info.host} db=${info.name} dialect=${info.dialect}`);
            console.log('📊 Database:', info);
            return latencyMs;
        } catch (err) {
            const warn = `⚠️ Waiting for MySQL... ${err && err.message}`;
            debugLog(warn);
            console.error('⚠️ Waiting for MySQL...', err && err.message);
            await new Promise(r => setTimeout(r, 3000));
        }
    }
    const baseMsg = '❌ MySQL is not reachable.';
    debugLog(baseMsg);
    console.error(baseMsg);
    if (allowStartWithoutDb) {
        const warn = '⚠️ ALLOW_START_WITHOUT_DB=true, starting server without active MySQL connection.';
        debugLog(warn);
        console.warn(warn);
        app.locals.dbConnected = false;
        return null;
    }
    const errMsg = '❌ MySQL is not reachable. Server stopped.';
    debugLog(errMsg);
    console.error(errMsg);
    process.exit(1);
}

async function ensureModelSchema(model) {
    try {
        if (!model) return;
        const qi = sequelize.getQueryInterface();
        const t = model.getTableName && model.getTableName();
        const tableName = (typeof t === 'string' ? t : t && t.tableName) || model.tableName;
        if (!tableName) return;
        const columns = await qi.describeTable(tableName);
        const attrs = model.rawAttributes || (model.getAttributes && model.getAttributes()) || {};
        for (const key of Object.keys(attrs)) {
            if (!columns[key]) {
                await qi.addColumn(tableName, key, attrs[key]);
            }
        }
    } catch (e) {
        debugLog('ensureModelSchema error: ' + (e && e.message));
    }
}

async function startServer() {
    const dialect = (sequelize && sequelize.getDialect && sequelize.getDialect()) || 'unknown';
    if (dialect !== 'mysql') {
        const msg = `❌ Invalid DB dialect at runtime: ${dialect}`;
        debugLog(msg);
        console.error(msg);
        process.exit(1);
    }

    await ensureMySQLConnection(10);
    if (!allowStartWithoutDb || app.locals.dbConnected !== false) {
        const StatBlock = require('./models/StatBlock');
        await ensureModelSchema(GlobalSeo);
        await ensureModelSchema(StatBlock);
        await ensureModelSchema(ServiceModel);
        await sequelize.sync(syncOptions);
        const msg = 'Database synced successfully (MySQL)';
        debugLog(msg);
        console.log(msg);
    }

    const server = app.listen(port, () => {
        const startMsg = `Server is running at http://localhost:${port}`;
        debugLog(startMsg);
        console.log(startMsg);
        try {
            const http = require('http');
            const opts = { host: '127.0.0.1', port, timeout: 2000 };
            http.get({ ...opts, path: '/' }).on('error', ()=>{});
            http.get({ ...opts, path: '/en' }).on('error', ()=>{});
            http.get({ ...opts, path: '/healthz' }).on('error', ()=>{});
            http.get({ ...opts, path: '/health/db' }).on('error', ()=>{});
        } catch (e) {
            debugLog('prewarm error: ' + (e && e.message));
        }
        setTimeout(async () => {
            if (allowStartWithoutDb && app.locals.dbConnected === false) {
                return;
            }
            try {
                const normalizeImageField = async (Model, fieldName, label) => {
                    const rows = await Model.findAll();
                    let c = 0;
                    for (const row of rows) {
                        const v = row[fieldName];
                        if (!v) continue;
                        const filename = storageService.mapDbValueToLocal(v);
                        if (!filename) continue;
                        const canonical = storageService.toDbValue(filename);
                        if (canonical !== v) {
                            await row.update({ [fieldName]: canonical });
                            c++;
                        }
                    }
                    if (c > 0) debugLog(`normalized ${label} ${c}`);
                };
                const Project = require('./models/Project');
                const Post = require('./models/Post');
                const Service = require('./models/Service');
                const Partner = require('./models/Partner');
                await normalizeImageField(Project, 'image', 'Project.image');
                await normalizeImageField(Post, 'image', 'Post.image');
                await normalizeImageField(Service, 'image', 'Service.image');
                await normalizeImageField(Partner, 'logo', 'Partner.logo');

                const ensureServicePlaceholders = async () => {
                    const placeholderName = 'service-default.png';
                    const placeholderAbs = storageService.buildAbsolutePath(placeholderName);
                    try {
                        if (!fs.existsSync(placeholderAbs)) {
                            const src = path.join(__dirname, 'views', '4433444.png');
                            if (fs.existsSync(src)) {
                                fs.copyFileSync(src, placeholderAbs);
                            }
                        }
                    } catch (e) {
                        debugLog('service placeholder copy error: ' + (e && e.message));
                    }
                    const placeholderDb = storageService.toDbValue(placeholderName);
                    let fixed = 0;
                    const rows = await Service.findAll();
                    for (const s of rows) {
                        const raw = s.image;
                        let filename = '';
                        let exists = false;
                        if (raw) {
                            filename = storageService.mapDbValueToLocal(raw);
                            if (filename) {
                                const abs = storageService.buildAbsolutePath(filename);
                                exists = fs.existsSync(abs);
                            }
                        }
                        if (!raw || !filename || !exists) {
                            await s.update({ image: placeholderDb });
                            fixed++;
                        }
                    }
                    if (fixed > 0) debugLog(`service placeholders applied: ${fixed}`);
                };

                await ensureServicePlaceholders();
            } catch (e) {
                debugLog('asset normalize error: ' + (e && e.message));
            }
        }, 1200);
    });

    try {
        server.keepAliveTimeout = Number(process.env.KEEP_ALIVE_MS || 65000);
        server.headersTimeout = Number(process.env.HEADERS_TIMEOUT_MS || 70000);
        server.requestTimeout = Number(process.env.REQ_TIMEOUT_MS || 15000);
        debugLog(`Server timeouts set: keepAlive=${server.keepAliveTimeout} headers=${server.headersTimeout} request=${server.requestTimeout}`);
    } catch (e) {
        debugLog('timeout tune error: ' + (e && e.message));
    }
}

startServer().catch(err => {
    const errMsg = `Database startup error: ${err && err.message}`;
    debugLog(errMsg);
    console.error(errMsg, err);
    process.exit(1);
});

// Export app for tests or external process managers
module.exports = app;
