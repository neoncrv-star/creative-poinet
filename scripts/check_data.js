const sequelize = require('../config/database');
const User = require('../models/User');
const Category = require('../models/Category');
const GlobalSeo = require('../models/GlobalSeo');
const Project = require('../models/Project');
const Service = require('../models/Service');
const Partner = require('../models/Partner');
const BlogPost = require('../models/BlogPost');
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
        
        if (counts.Categories > 0) {
            const categories = await Category.findAll({ limit: 5, raw: true });
            console.log('Sample Categories:', categories.map(c => c.name_ar || c.name_en));
        }
        
        if (counts.Projects > 0) {
            const projects = await Project.findAll({ limit: 5, raw: true });
            console.log('Sample Projects:', projects.map(p => p.title_ar || p.title_en));
        }

    } catch (e) {
        console.error('Error:', e);
    } finally {
        await sequelize.close();
    }
}

run();
