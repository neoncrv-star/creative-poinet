const express = require('express');
const path = require('path');
const session = require('express-session');
const sequelize = require('./config/database');
const seed = require('./seed');

const app = express();
const port = 3000;

// Session Config
app.use(session({
    secret: 'creative_point_secret_key', // Should be in env var
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 3600000 } // 1 hour
}));

// Import Routes
const mainRoutes = require('./routes/index');
const adminRoutes = require('./routes/admin');

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
    // Check if we need to seed (simple check: if no users exist)
    const User = require('./models/User');
    const userCount = await User.count();
    if (userCount === 0) {
        console.log('Seeding database...');
        await seed();
    }
    
    app.listen(port, () => {
        console.log(`Server is running at http://localhost:${port}`);
    });
}).catch(err => console.error('Database sync error:', err));
