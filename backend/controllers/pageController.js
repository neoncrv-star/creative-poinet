const Project = require('../models/Project');
const GlobalSeo = require('../models/GlobalSeo');
const Service = require('../models/Service');
const Partner = require('../models/Partner');
const Contact = require('../models/Contact');
const StatBlock = require('../models/StatBlock');
const Philosophy = require('../models/Philosophy');
const Post = require('../models/Post');
const fs = require('fs');
const path = require('path');
const logFile = path.join(__dirname, '..', 'debug.log');
const debugLog = (msg) => {
    try {
        fs.appendFileSync(logFile, `[${new Date().toISOString()}] FRONT: ${msg}\n`);
    } catch {}
};

const withTimeout = require('../utils/withTimeout');
const storageService = require('../src/storage/storage.service');

const resolveServiceImageDiagnostics = () => {
    return async (services) => {
        try {
            if (!Array.isArray(services) || !services.length) return;
            services.slice(0, 12).forEach((s) => {
                const raw = s.image || '';
                let rel = '';
                let abs = '';
                let exists = false;
                try {
                    rel = storageService.mapDbValueToLocal(raw);
                    if (rel) {
                        abs = storageService.buildAbsolutePath(rel);
                        exists = fs.existsSync(abs);
                    }
                } catch {}
                debugLog(`SERVICE_IMG id=${s.id} raw="${raw}" rel="${rel}" exists=${exists} abs="${abs}"`);
            });
        } catch (e) {
            debugLog(`SERVICE_IMG_DIAG_ERROR: ${e && e.message}`);
        }
    };
};

const diagnoseServiceImages = resolveServiceImageDiagnostics();

exports.getHome = async (req, res) => {
    try {
        const t0 = Date.now();
        const cap = Number(process.env.HOME_QUERY_TIMEOUT_MS || 800);
        const [projects, partners, posts, seo, stats, services] = await Promise.all([
            withTimeout(Project.findAll({ limit: 10, order: [['createdAt', 'DESC']] }), cap, []),
            withTimeout(Partner.findAll({ where: { is_active: true }, order: [['display_order', 'ASC']] }), cap, []),
            withTimeout(Post.findAll({ limit: 3, order: [['date', 'DESC']] }), cap, []),
            withTimeout(GlobalSeo.findOne(), cap, null),
            withTimeout(StatBlock.findAll({ where: { is_active: true }, order: [['display_order', 'ASC']] }), cap, []),
            withTimeout(Service.findAll({ where: { is_active: true }, order: [['display_order', 'ASC']] }), cap, [])
        ]);
        const dt = Date.now() - t0;
        debugLog(`Home data fetched in ${dt}ms -> projects=${projects.length}, partners=${partners.length}, posts=${posts.length}`);
        await diagnoseServiceImages(services);
        
        
        const pageSeo = {
            title: seo ? (seo.homeTitle || 'الرئيسية') : 'الرئيسية',
            seoDescription: seo ? seo.homeDescription : ''
        };

        res.render('index-ar', { 
            title: pageSeo.title, 
            projects,
            partners,
            posts,
            seo,
            globalSeo: seo,
            pageSeo,
            stats,
            services,
            lang: 'ar'
        });
    } catch (error) {
        console.error(error);
        debugLog(`Home data error: ${error.message}`);
        res.render('index-ar', { title: 'الرئيسية', projects: [], partners: [], posts: [], seo: null, globalSeo: null, stats: [], services: [], lang: 'ar' });
    }
};

exports.getHomeEn = async (req, res) => {
    try {
        const t0 = Date.now();
        const cap = Number(process.env.HOME_QUERY_TIMEOUT_MS || 800);
        const [projects, partners, posts, seo, stats, services] = await Promise.all([
            withTimeout(Project.findAll({ limit: 10, order: [['createdAt', 'DESC']] }), cap, []),
            withTimeout(Partner.findAll({ where: { is_active: true }, order: [['display_order', 'ASC']] }), cap, []),
            withTimeout(Post.findAll({ limit: 3, order: [['date', 'DESC']] }), cap, []),
            withTimeout(GlobalSeo.findOne(), cap, null),
            withTimeout(StatBlock.findAll({ where: { is_active: true }, order: [['display_order', 'ASC']] }), cap, []),
            withTimeout(Service.findAll({ where: { is_active: true }, order: [['display_order', 'ASC']] }), cap, [])
        ]);
        const dt = Date.now() - t0;
        debugLog(`Home(EN) data fetched in ${dt}ms -> projects=${projects.length}, partners=${partners.length}, posts=${posts.length}`);
        await diagnoseServiceImages(services);
        
        
        const pageSeo = {
            title: 'Home',
            seoDescription: seo ? seo.homeDescription : '' // Ideally should have English field
        };

        res.render('index-en', { 
            title: pageSeo.title, 
            projects, 
            partners,
            posts,
            seo,
            globalSeo: seo,
            pageSeo,
            stats,
            services,
            lang: 'en'
        });
    } catch (error) {
        console.error(error);
        debugLog(`Home(EN) data error: ${error.message}`);
        res.render('index-en', { title: 'Home', projects: [], partners: [], posts: [], seo: null, globalSeo: null, stats: [], services: [], lang: 'en' });
    }
};

exports.postContact = async (req, res) => {
    try {
        const { name, email, phone, service, message } = req.body;
        
        // Save to database
        await Contact.create({
            name,
            email,
            phone,
            service,
            message
        });

        // Redirect back with success flag
        res.redirect('/?success=true#contact');
    } catch (error) {
        console.error('Contact form error:', error);
        res.redirect('/?error=true#contact');
    }
};
exports.getPhilosophyPage = async (req, res) => {
    try {
        const seo = await GlobalSeo.findOne();
        let data = await Philosophy.findOne();
        if (!data) data = {}; // في حال لم يتم إدخال بيانات بعد
        
        res.render('philosophy', { 
            title: data.mainTitleAr || 'فلسفتنا', 
            data,
            seo,
            globalSeo: seo,
            lang: req.path.includes('/en') ? 'en' : 'ar'
        });
    } catch (error) {
        console.error(error);
        res.status(500).send('Server Error');
    }
};