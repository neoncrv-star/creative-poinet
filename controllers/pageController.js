const Project = require('../models/Project');
const GlobalSeo = require('../models/GlobalSeo');

exports.getHome = async (req, res) => {
    try {
        const projects = await Project.findAll({ limit: 3 });
        const seo = await GlobalSeo.findOne();
        
        const pageSeo = {
            title: seo ? (seo.homeTitle || 'الرئيسية') : 'الرئيسية',
            seoDescription: seo ? seo.homeDescription : ''
        };

        res.render('home_ar', { 
            title: pageSeo.title, 
            projects, 
            seo, 
            pageSeo,
            lang: 'ar'
        });
    } catch (error) {
        console.error(error);
        res.render('home_ar', { title: 'الرئيسية', projects: [], seo: null, lang: 'ar' });
    }
};

exports.getHomeEn = async (req, res) => {
    try {
        const projects = await Project.findAll({ limit: 3 });
        const seo = await GlobalSeo.findOne();
        
        const pageSeo = {
            title: 'Home',
            seoDescription: seo ? seo.homeDescription : '' // Ideally should have English field
        };

        res.render('home_en', { 
            title: 'Home', 
            projects, 
            seo, 
            pageSeo,
            lang: 'en'
        });
    } catch (error) {
        console.error(error);
        res.render('home_en', { title: 'Home', projects: [], seo: null, lang: 'en' });
    }
};
