const Project = require('../models/Project');
const GlobalSeo = require('../models/GlobalSeo');

exports.getHome = async (req, res) => {
    try {
        // Fetch featured projects (limit 3)
        const projects = await Project.findAll({ limit: 3 });
        const seo = await GlobalSeo.findOne();
        
        // Pass Home specific SEO
        const pageSeo = {
            title: seo ? (seo.homeTitle || 'الرئيسية') : 'الرئيسية',
            seoDescription: seo ? seo.homeDescription : ''
        };

        res.render('index', { 
            title: pageSeo.title, 
            projects, 
            seo, 
            pageSeo 
        });
    } catch (error) {
        console.error(error);
        res.render('index', { title: 'الرئيسية', projects: [], seo: null });
    }
};
