const Project = require('../models/Project');
const GlobalSeo = require('../models/GlobalSeo');
const Service = require('../models/Service');
const Partner = require('../models/Partner');
const Contact = require('../models/Contact');
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

exports.getHome = async (req, res) => {
    try {
        const t0 = Date.now();
        const cap = Number(process.env.HOME_QUERY_TIMEOUT_MS || 800);
        const [projects, services, partners, posts, seo] = await Promise.all([
            withTimeout(Project.findAll({ limit: 10, order: [['createdAt', 'DESC']] }), cap, []),
            withTimeout(Service.findAll({ where: { is_active: true }, order: [['display_order', 'ASC']] }), cap, []),
            withTimeout(Partner.findAll({ where: { is_active: true }, order: [['display_order', 'ASC']] }), cap, []),
            withTimeout(Post.findAll({ limit: 3, order: [['date', 'DESC']] }), cap, []),
            withTimeout(GlobalSeo.findOne(), cap, null)
        ]);
        const dt = Date.now() - t0;
        debugLog(`Home data fetched in ${dt}ms -> projects=${projects.length}, services=${services.length}, partners=${partners.length}, posts=${posts.length}`);
        
        
        // Temporary override for video URL - using a direct MP4 link for reliability
        // Using a highly reliable test video first to ensure player works, then we can switch to a themed one
        const defaultVideoUrl = 'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4'; 
        const oldDefaultUrls = [
            'https://www.youtube.com/embed/dQw4w9WgXcQ?autoplay=1&mute=1&controls=0&loop=1&playlist=dQw4w9WgXcQ',
            'https://www.youtube.com/embed/kDqTPT1SQbU?autoplay=1&mute=1&controls=0&loop=1&playlist=kDqTPT1SQbU',
            'https://www.youtube.com/embed/kDqTPT1SQbU?autoplay=1&mute=1&controls=0&loop=1&playlist=kDqTPT1SQbU&showinfo=0&rel=0&iv_load_policy=3&modestbranding=1&disablekb=1&playsinline=1',
            'https://www.youtube.com/embed/M7FIvfx5J10?autoplay=1&mute=1&controls=0&loop=1&playlist=M7FIvfx5J10&showinfo=0&rel=0&iv_load_policy=3&modestbranding=1&disablekb=1&playsinline=1',
            'https://www.youtube.com/embed/M7FIvfx5J10?autoplay=1&mute=1&controls=0&loop=1&playlist=M7FIvfx5J10&showinfo=0&rel=0&iv_load_policy=3&modestbranding=1&disablekb=1&playsinline=1&origin=http://localhost:3000'
        ];
        
        if (seo && (!seo.heroVideoUrl || (!seo.heroVideoMode || seo.heroVideoMode === 'url') && (oldDefaultUrls.includes(seo.heroVideoUrl) || seo.heroVideoUrl.includes('youtube.com/embed/M7FIvfx5J10')))) {
            console.log('Replacing Hero Video URL:', seo.heroVideoUrl, 'with', defaultVideoUrl);
            seo.heroVideoUrl = defaultVideoUrl;
        }

        const pageSeo = {
            title: seo ? (seo.homeTitle || 'الرئيسية') : 'الرئيسية',
            seoDescription: seo ? seo.homeDescription : ''
        };

        res.render('home_ar', { 
            title: pageSeo.title, 
            projects,
            services, 
            partners,
            posts,
            seo, 
            pageSeo,
            lang: 'ar'
        });
    } catch (error) {
        console.error(error);
        debugLog(`Home data error: ${error.message}`);
        res.render('home_ar', { title: 'الرئيسية', projects: [], services: [], partners: [], posts: [], seo: null, lang: 'ar' });
    }
};

exports.getHomeEn = async (req, res) => {
    try {
        const t0 = Date.now();
        const cap = Number(process.env.HOME_QUERY_TIMEOUT_MS || 800);
        const [projects, services, partners, posts, seo] = await Promise.all([
            withTimeout(Project.findAll({ limit: 10, order: [['createdAt', 'DESC']] }), cap, []),
            withTimeout(Service.findAll({ where: { is_active: true }, order: [['display_order', 'ASC']] }), cap, []),
            withTimeout(Partner.findAll({ where: { is_active: true }, order: [['display_order', 'ASC']] }), cap, []),
            withTimeout(Post.findAll({ limit: 3, order: [['date', 'DESC']] }), cap, []),
            withTimeout(GlobalSeo.findOne(), cap, null)
        ]);
        const dt = Date.now() - t0;
        debugLog(`Home(EN) data fetched in ${dt}ms -> projects=${projects.length}, services=${services.length}, partners=${partners.length}, posts=${posts.length}`);
        
        
        // Temporary override for video URL - using a direct MP4 link for reliability
        // Using a highly reliable test video first to ensure player works
        const defaultVideoUrl = 'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4'; 
        const oldDefaultUrls = [
            'https://www.youtube.com/embed/dQw4w9WgXcQ?autoplay=1&mute=1&controls=0&loop=1&playlist=dQw4w9WgXcQ',
            'https://www.youtube.com/embed/kDqTPT1SQbU?autoplay=1&mute=1&controls=0&loop=1&playlist=kDqTPT1SQbU',
            'https://www.youtube.com/embed/kDqTPT1SQbU?autoplay=1&mute=1&controls=0&loop=1&playlist=kDqTPT1SQbU&showinfo=0&rel=0&iv_load_policy=3&modestbranding=1&disablekb=1&playsinline=1',
            'https://www.youtube.com/embed/M7FIvfx5J10?autoplay=1&mute=1&controls=0&loop=1&playlist=M7FIvfx5J10&showinfo=0&rel=0&iv_load_policy=3&modestbranding=1&disablekb=1&playsinline=1',
            'https://www.youtube.com/embed/M7FIvfx5J10?autoplay=1&mute=1&controls=0&loop=1&playlist=M7FIvfx5J10&showinfo=0&rel=0&iv_load_policy=3&modestbranding=1&disablekb=1&playsinline=1&origin=http://localhost:3000'
        ];
        
        if (seo && (!seo.heroVideoUrl || (!seo.heroVideoMode || seo.heroVideoMode === 'url') && (oldDefaultUrls.includes(seo.heroVideoUrl) || seo.heroVideoUrl.includes('youtube.com/embed/M7FIvfx5J10')))) {
            console.log('Replacing EN Hero Video URL:', seo.heroVideoUrl, 'with', defaultVideoUrl);
            seo.heroVideoUrl = defaultVideoUrl;
        }

        const pageSeo = {
            title: 'Home',
            seoDescription: seo ? seo.homeDescription : '' // Ideally should have English field
        };

        res.render('home_en', { 
            title: pageSeo.title, 
            projects, 
            services,
            partners,
            posts,
            seo, 
            pageSeo,
            lang: 'en'
        });
    } catch (error) {
        console.error(error);
        debugLog(`Home(EN) data error: ${error.message}`);
        res.render('home_en', { title: 'Home', projects: [], services: [], partners: [], posts: [], seo: null, lang: 'en' });
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
