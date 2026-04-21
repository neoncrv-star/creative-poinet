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

// ======================================================
// دالة مشتركة لمعالجة مسارات الصور
// ======================================================
const assetPath = (p) => p
    ? (p.startsWith('http') ? p : (p.startsWith('/') ? p : '/' + p))
    : '';

// ======================================================
// تشخيص صور الخدمات (للـ debug فقط)
// ======================================================
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

// ======================================================
// الصفحة الرئيسية - عربي
// ======================================================
exports.getHome = async (req, res) => {
    try {
        const projects  = await Project.findAll({ limit: 10, order: [['createdAt', 'DESC']] });
        const partners  = await Partner.findAll({ where: { is_active: true }, order: [['display_order', 'ASC']] });
        const services  = await Service.findAll({ where: { is_active: true }, order: [['display_order', 'ASC']] });
        const posts     = await Post.findAll({ limit: 3, order: [['date', 'DESC']] });
        const seo       = await GlobalSeo.findOne();
        const stats     = await StatBlock.findAll({ where: { is_active: true }, order: [['display_order', 'ASC']] });

        res.render('index-ar', {
            title: seo ? (seo.homeTitle || 'الرئيسية') : 'الرئيسية',
            projects:   projects || [],
            partners:   partners || [],
            posts:      posts    || [],
            globalSeo:  seo,
            seo:        seo,
            stats:      stats    || [],
            services:   services || [],
            lang: 'ar',
            assetPath
        });
    } catch (error) {
        console.error('Home(AR) Error:', error);
        res.render('index-ar', {
            title: 'الرئيسية',
            projects: [], partners: [], posts: [],
            seo: null, globalSeo: null,
            stats: [], services: [],
            lang: 'ar',
            assetPath
        });
    }
};

// ======================================================
// الصفحة الرئيسية - إنجليزي
// ======================================================
exports.getHomeEn = async (req, res) => {
    try {
        const t0  = Date.now();
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
        debugLog(`Home(EN) fetched in ${dt}ms -> projects=${projects.length}, partners=${partners.length}, posts=${posts.length}`);
        await diagnoseServiceImages(services);

        const pageSeo = {
            title: 'Home',
            seoDescription: seo ? seo.homeDescription : ''
        };

        res.render('index-en', {
            title: pageSeo.title,
            projects, partners, posts,
            seo, globalSeo: seo, pageSeo,
            stats, services,
            lang: 'en',
            assetPath
        });
    } catch (error) {
        console.error('Home(EN) Error:', error);
        debugLog(`Home(EN) error: ${error.message}`);
        res.render('index-en', {
            title: 'Home',
            projects: [], partners: [], posts: [],
            seo: null, globalSeo: null,
            stats: [], services: [],
            lang: 'en',
            assetPath
        });
    }
};

// ======================================================
// نموذج التواصل
// ======================================================
exports.postContact = async (req, res) => {
    try {
        const { name, email, phone, service, message } = req.body;
        await Contact.create({ name, email, phone, service, message });
        res.redirect('/?success=true#contact');
    } catch (error) {
        console.error('Contact form error:', error);
        res.redirect('/?error=true#contact');
    }
};

// ======================================================
// صفحة فلسفتنا
// ======================================================
exports.getPhilosophyPage = async (req, res) => {
    try {
        const isEn  = req.path.includes('/en');
        const seo   = await GlobalSeo.findOne();
        const raw   = await Philosophy.findOne();

        // تحويل Sequelize instance إلى plain object بأمان
        const data  = raw ? raw.get({ plain: true }) : {};

        res.render('philosophy', {
            title:     isEn ? (data.mainTitleEn || 'Our Philosophy') : (data.mainTitleAr || 'فلسفتنا'),
            data,
            seo,
            globalSeo: seo,
            lang:      isEn ? 'en' : 'ar',
            assetPath
        });
    } catch (error) {
        console.error('Philosophy page error:', error);
        res.status(500).send('Server Error');
    }
};

// ======================================================
// صفحة الخدمات
// ======================================================
exports.getServicesPage = async (req, res) => {
    try {
        const isEn    = req.path.includes('/en');
        const seo      = await GlobalSeo.findOne();
        const services = await Service.findAll({
            where: { is_active: true },
            order: [['display_order', 'ASC']]
        });

        res.render('services', {
            title:    isEn ? 'Our Services | Creative Point' : 'خدماتنا | Creative Point',
            services,
            seo,
            globalSeo: seo,
            lang:     isEn ? 'en' : 'ar',
            path:     req.path,
            assetPath
        });
    } catch (error) {
        console.error('Services page error:', error);
        res.status(500).send('Server Error');
    }
};