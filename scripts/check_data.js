require('dotenv').config();
const sequelize = require('../config/database');
const User = require('../models/User');
const Category = require('../models/Category');
const GlobalSeo = require('../models/GlobalSeo');
const Project = require('../models/Project');
const Service = require('../models/Service');
const Partner = require('../models/Partner');
const BlogPost = require('../models/Post');
const Contact = require('../models/Contact');

async function run() {
    try {
        await sequelize.authenticate();
        console.log('Database connected.');
        
        const counts = {
            Users: await User.count(),
            Categories: await Category.count(),
            GlobalSeo: await GlobalSeo.count(),
            Projects: await Project.count(),
            Services: await Service.count(),
            Partners: await Partner.count(),
            BlogPosts: await BlogPost.count(),
            Contacts: await Contact.count()
        };
        
        console.log('Record counts:');
        console.log(JSON.stringify(counts, null, 2));
        
        if (counts.BlogPosts > 0) {
            const posts = await BlogPost.findAll({ limit: 5, raw: true });
            console.log('Sample Blog Posts:', posts.map(p => p.title));
        }
        
        if (counts.Services > 0) {
            const services = await Service.findAll({ limit: 5, raw: true });
            console.log('Sample Services:', services.map(s => s.title));
        }

    } catch (e) {
        console.error('Error:', e);
    } finally {
        await sequelize.close();
    }
}

run();
