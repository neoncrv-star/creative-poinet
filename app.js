const express = require('express');
require('dotenv').config();
const path = require('path');
const session = require('express-session');
const FileStore = require('session-file-store')(session);
const sequelize = require('./config/database');

const app = express();
const port = process.env.PORT || 3000;

// Session Config
app.set('trust proxy', 1); // trust first proxy
app.use(session({
    store: new FileStore({
        path: './sessions',
        retries: 0
    }),
    secret: process.env.SESSION_SECRET || 'creative_point_secret_key',
    resave: false,
    saveUninitialized: false,
    name: 'creative_point_session',
    cookie: { 
        maxAge: 3600000 * 24, // 24 hours
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
sequelize.sync({ alter: true }).then(async () => {
    app.listen(port, () => {
        console.log(`Server is running at http://localhost:${port}`);
    });
}).catch(err => console.error('Database sync error:', err));
