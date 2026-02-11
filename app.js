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
    const envFiles = [
        '/home/u494530316/domains/cpoint-sa.com/public_html/.env',
        '/home/u494530316/domains/cpoint-sa.com/public_html/.env.prod',
        path.join(__dirname, '.env'),
        path.join(__dirname, '.env.prod')
    ];

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
console.log('App version: 1.0.3 - Performance Optimized');

// Serve static files FIRST to avoid running middleware for assets
app.use(express.static(path.join(__dirname, 'public'), {
    maxAge: '1d', // Cache static assets for 1 day
    etag: true
}));

// Ensure necessary directories exist
['public/uploads', 'sessions', 'data'].forEach(dir => {
    const fullPath = path.join(__dirname, dir);
    if (!fs.existsSync(fullPath)) {
        fs.mkdirSync(fullPath, { recursive: true });
    }
});
const port = process.env.PORT || 3000;

// Session Config
app.set('trust proxy', 1); // trust first proxy
app.use(session({
    store: new FileStore({
        path: './sessions',
        retries: 5, // Increase retries for reliability
        fileExtension: '.json',
        ttl: 86400 * 7, // Session persists for 7 days
        reapInterval: 3600 // Clean up expired sessions every hour
    }),
    secret: process.env.SESSION_SECRET || 'creative_point_secret_key',
    resave: true, // Force session to be saved back to the session store
    saveUninitialized: false,
    name: 'creative_point_session',
    cookie: { 
        maxAge: 3600000 * 24 * 7, // 7 days
        secure: false, // Set to false if not using HTTPS
        httpOnly: true,
        sameSite: 'lax'
    }
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
const isSQLite = !process.env.DB_NAME;
const syncOptions = { 
    alter: !isSQLite && (process.env.NODE_ENV === 'development'),
    force: false 
};

sequelize.sync(syncOptions)
    .then(async () => {
        const msg = `Database synced successfully (${isSQLite ? 'SQLite' : 'MySQL'})`;
        debugLog(msg);
        console.log(msg);
        app.listen(port, () => {
            const startMsg = `Server is running at http://localhost:${port}`;
            debugLog(startMsg);
            console.log(startMsg);
        });
    })
    .catch(err => {
        const errMsg = `Database sync error (trying fallback): ${err.message}`;
        debugLog(errMsg);
        console.error(errMsg, err);
        // Fallback sync for constraint issues
        sequelize.sync().then(() => {
            const fallbackMsg = `Server is running at http://localhost:${port} (Fallback Sync)`;
            debugLog(fallbackMsg);
            console.log(fallbackMsg);
            app.listen(port, () => {
                console.log(fallbackMsg);
            });
        }).catch(finalErr => {
            const critMsg = `Critical Database error: ${finalErr.message}`;
            debugLog(critMsg);
            console.error(critMsg, finalErr);
        });
    });
