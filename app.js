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
const sequelize = require('./config/database');

const app = express();
console.log('App version: 1.0.2 - Robust path handling');

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

// Global Data Middleware
const GlobalSeo = require('./models/GlobalSeo');
const Category = require('./models/Category');

app.use(async (req, res, next) => {
    try {
        const seo = await GlobalSeo.findOne();
        const categories = await Category.findAll({ order: [['display_order', 'ASC']] });
        res.locals.globalSeo = seo;
        res.locals.globalCategories = categories;
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

// Static files
app.use(express.static(path.join(__dirname, 'public')));

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
        console.log(`Database synced successfully (${isSQLite ? 'SQLite' : 'MySQL'})`);
        app.listen(port, () => {
            console.log(`Server is running at http://localhost:${port}`);
        });
    })
    .catch(err => {
        console.error('Database sync error (trying fallback):', err);
        // Fallback sync for constraint issues
        sequelize.sync().then(() => {
            app.listen(port, () => {
                console.log(`Server is running at http://localhost:${port} (Fallback Sync)`);
            });
        }).catch(finalErr => console.error('Critical Database error:', finalErr));
    });
