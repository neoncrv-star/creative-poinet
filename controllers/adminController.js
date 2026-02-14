const User = require('../models/User');
const Project = require('../models/Project');
const Category = require('../models/Category');
const Post = require('../models/Post');
const GlobalSeo = require('../models/GlobalSeo');
const Service = require('../models/Service');
const Partner = require('../models/Partner');
const Contact = require('../models/Contact');
const sequelize = require('../config/database');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const logFile = path.join(__dirname, '../debug.log');
const debugLog = (msg) => fs.appendFileSync(logFile, `[${new Date().toISOString()}] ${msg}\n`);

// Helper to delete file
// NOTE: Intentionally disabled physical deletion to keep assets immutable.
// Files are content-addressed and never removed to avoid accidental loss.
const deleteFile = (_filePath) => {};

// Content-addressed storage: move uploaded file to <sha256>.<ext> and return '/uploads/<name>'
const toHashedAsset = async (file) => {
    if (!file) return null;
    const tmpPath = file.path; // absolute or relative from process cwd
    const absTmp = path.isAbsolute(tmpPath) ? tmpPath : path.join(process.cwd(), tmpPath);
    const buf = fs.readFileSync(absTmp);
    const sha = crypto.createHash('sha256').update(buf).digest('hex').slice(0, 32);
    const ext = (path.extname(file.originalname) || path.extname(file.filename) || '').toLowerCase() || '.bin';
    const finalName = `${sha}${ext}`;
    const uploadsDir = path.join(__dirname, '../public/uploads');
    if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });
    const finalAbs = path.join(uploadsDir, finalName);
    // Write original hashed if not exists
    if (!fs.existsSync(finalAbs)) fs.renameSync(absTmp, finalAbs);
    else { try { fs.unlinkSync(absTmp); } catch {} }
    // Try to produce WebP variant
    try {
        // Lazy require to tolerate environments without sharp
        // If sharp is missing or fails, we fallback to original path
        const sharp = require('sharp');
        const webpName = `${sha}.webp`;
        const finalWebpAbs = path.join(uploadsDir, webpName);
        if (!fs.existsSync(finalWebpAbs)) {
            try {
                await sharp(finalAbs).webp({ effort: 4, quality: 82 }).toFile(finalWebpAbs);
                debugLog(`ASSET WEBP: ${webpName} created`);
            } catch (e) {
                return '/uploads/' + finalName;
            }
        }
        return '/uploads/' + webpName;
    } catch (e) {
        return '/uploads/' + finalName;
    }
};

exports.getLogin = (req, res) => {
    res.render('admin/login', { title: 'تسجيل الدخول', error: null });
};

exports.postLogin = async (req, res) => {
    const { username, password } = req.body;
    try {
        debugLog(`Login attempt for username: ${username}`);
        debugLog(`Current DB dialect: ${sequelize.getDialect()}`);
        const user = await User.findOne({ where: { username } });
        if (!user) {
            debugLog(`User not found: ${username}`);
            return res.render('admin/login', { title: 'تسجيل الدخول', error: 'بيانات الدخول غير صحيحة' });
        }
        
        debugLog(`User found, comparing passwords...`);
        const isMatch = await user.validPassword(password);
        debugLog(`Password match result: ${isMatch}`);
        
        if (!isMatch) {
            debugLog(`Password mismatch for user: ${username}`);
            return res.render('admin/login', { title: 'تسجيل الدخول', error: 'بيانات الدخول غير صحيحة' });
        }
        
        req.session.userId = user.id;
        req.session.userRole = user.role;
        debugLog(`Session set for user ID: ${user.id}. Redirecting to /admin...`);
        res.redirect('/admin');
    } catch (error) {
        debugLog(`Login error: ${error.message}`);
        console.error('Login error details:', error);
        res.render('admin/login', { title: 'تسجيل الدخول', error: 'حدث خطأ ما' });
    }
};

exports.logout = (req, res) => {
    req.session.destroy(() => {
        res.redirect('/admin/login');
    });
};

// --- Account: Change Password ---
exports.getChangePassword = async (req, res) => {
    res.render('admin/change-password', {
        title: 'لوحة التحكم | تغيير كلمة المرور',
        path: '/admin/account/password',
        error: null,
        success: null
    });
};

exports.postChangePassword = async (req, res) => {
    const { currentPassword, newPassword, confirmPassword } = req.body;
    try {
        const userId = req.session.userId;
        if (!userId) {
            return res.redirect('/admin/login');
        }
        const user = await User.findByPk(userId);
        if (!user) {
            return res.render('admin/change-password', {
                title: 'لوحة التحكم | تغيير كلمة المرور',
                path: '/admin/account/password',
                error: 'المستخدم غير موجود',
                success: null
            });
        }

        // Validate current password
        const isMatch = await user.validPassword(currentPassword || '');
        if (!isMatch) {
            return res.render('admin/change-password', {
                title: 'لوحة التحكم | تغيير كلمة المرور',
                path: '/admin/account/password',
                error: 'كلمة المرور الحالية غير صحيحة',
                success: null
            });
        }

        // Validate new password
        if (!newPassword || newPassword.length < 8) {
            return res.render('admin/change-password', {
                title: 'لوحة التحكم | تغيير كلمة المرور',
                path: '/admin/account/password',
                error: 'يجب أن تكون كلمة المرور الجديدة 8 أحرف على الأقل',
                success: null
            });
        }
        if (newPassword !== confirmPassword) {
            return res.render('admin/change-password', {
                title: 'لوحة التحكم | تغيير كلمة المرور',
                path: '/admin/account/password',
                error: 'تأكيد كلمة المرور غير متطابق',
                success: null
            });
        }
        if (newPassword === currentPassword) {
            return res.render('admin/change-password', {
                title: 'لوحة التحكم | تغيير كلمة المرور',
                path: '/admin/account/password',
                error: 'كلمة المرور الجديدة لا يجب أن تطابق الحالية',
                success: null
            });
        }

        // Update and save (hashing handled by model hook)
        user.password = newPassword;
        await user.save();

        return res.render('admin/change-password', {
            title: 'لوحة التحكم | تغيير كلمة المرور',
            path: '/admin/account/password',
            error: null,
            success: 'تم تغيير كلمة المرور بنجاح'
        });
    } catch (error) {
        console.error('Change password error:', error);
        return res.render('admin/change-password', {
            title: 'لوحة التحكم | تغيير كلمة المرور',
            path: '/admin/account/password',
            error: 'حدث خطأ غير متوقع',
            success: null
        });
    }
};

exports.getDashboard = async (req, res) => {
    try {
        const projectCount = await Project.count();
        const postCount = await Post.count();
        // Calculate total views
        const projectViews = await Project.sum('views') || 0;
        const postViews = await Post.sum('views') || 0;
        const totalViews = projectViews + postViews;
        const serviceCount = await Service.count();
        const partnerCount = await Partner.count();
        const newContactsCount = await Contact.count({ where: { status: 'new' } });
        
        res.render('admin/dashboard', { 
            title: 'لوحة التحكم | الرئيسية',
            projectCount,
            postCount,
            serviceCount,
            partnerCount,
            newContactsCount,
            visitorCount: totalViews // Using real view count now
        });
    } catch (error) {
        console.error(error);
        res.render('admin/dashboard', { 
            title: 'لوحة التحكم | الرئيسية',
            projectCount: 0,
            postCount: 0,
            serviceCount: 0,
            visitorCount: 0
        });
    }
};

exports.getLogs = async (req, res) => {
    try {
        const filePath = path.join(__dirname, '../debug.log');
        let content = '';
        if (fs.existsSync(filePath)) {
            const data = fs.readFileSync(filePath, 'utf8');
            const lines = data.trim().split('\n');
            content = lines.slice(-200).join('\n');
        }
        res.render('admin/logs', { 
            title: 'لوحة التحكم | سجلات النظام',
            path: '/admin/logs',
            logs: content 
        });
    } catch (e) {
        res.render('admin/logs', { 
            title: 'لوحة التحكم | سجلات النظام',
            path: '/admin/logs',
            logs: 'تعذر قراءة السجلات' 
        });
    }
};

// --- Site Health ---
exports.getSiteHealth = async (req, res) => {
    try {
        const childProcess = require('child_process');
        let version = process.env.APP_VERSION || '';
        if (!version) {
            try { version = childProcess.execSync('git rev-parse --short HEAD').toString().trim(); } catch {}
        }
        const dialect = (sequelize && sequelize.getDialect && sequelize.getDialect()) || 'unknown';
        const [svcCount, prjCount, prtCount, postCount] = await Promise.all([
            require('../models/Service').count(),
            require('../models/Project').count(),
            require('../models/Partner').count(),
            require('../models/Post').count()
        ]);
        // Optional external ping using siteUrl from SEO
        let siteUrl = 'https://cpoint-sa.com';
        try {
            const GlobalSeo = require('../models/GlobalSeo');
            const seo = await GlobalSeo.findOne();
            if (seo && seo.siteUrl) siteUrl = seo.siteUrl.replace(/\/+$/, '');
        } catch {}
        const https = require('https');
        const tryHead = (url) => new Promise(resolve => {
            const t0 = Date.now();
            try {
                const reqH = https.request(url, { method: 'HEAD', timeout: 5000 }, (resp) => {
                    resolve({ url, status: resp.statusCode, ms: Date.now() - t0 });
                });
                reqH.on('timeout', () => { reqH.destroy(); resolve({ url, status: 0, ms: Date.now() - t0 }); });
                reqH.on('error', () => resolve({ url, status: 0, ms: Date.now() - t0 }));
                reqH.end();
            } catch {
                resolve({ url, status: 0, ms: Date.now() - t0 });
            }
        });
        const probes = await Promise.all([
            tryHead(siteUrl + '/'),
            tryHead(siteUrl + '/en'),
            tryHead(siteUrl + '/portfolio')
        ]);
        res.render('admin/health', {
            title: 'فحص صحة الموقع والأداء',
            path: '/admin/health',
            version,
            dialect,
            counts: { services: svcCount, projects: prjCount, partners: prtCount, posts: postCount },
            probes
        });
    } catch (e) {
        console.error(e);
        res.status(500).send('Server Error');
    }
};

// --- Uploads Browser ---
exports.listUploads = async (req, res) => {
    try {
        const dir = path.join(__dirname, '../public/uploads');
        if (!fs.existsSync(dir)) return res.json({ files: [] });
        const allowed = new Set(['.png', '.jpg', '.jpeg', '.gif', '.svg', '.webp', '.avif', '.jfif']);
        const entries = fs.readdirSync(dir).filter(f => allowed.has(path.extname(f).toLowerCase()));
        const files = entries.map(name => {
            const p = path.join(dir, name);
            let stat = { size: 0, mtimeMs: 0 };
            try { stat = fs.statSync(p); } catch {}
            return {
                name,
                url: '/uploads/' + name,
                bytes: stat.size,
                mtimeMs: stat.mtimeMs
            };
        }).sort((a, b) => b.mtimeMs - a.mtimeMs);
        res.json({ files });
    } catch (e) {
        console.error(e);
        res.json({ files: [] });
    }
};

// --- Assets Audit & Sync ---
const collectAssetRefs = async () => {
    const refs = [];
    const pushRef = (type, id, field, value, title) => {
        if (!value) return;
        const isExternal = /^https?:\/\//i.test(value);
        let rel = value;
        if (!isExternal && value.startsWith('/uploads/')) {
            rel = value.replace(/^\/+/, '');
        }
        let exists = true;
        let fileSize = 0;
        if (!isExternal && rel.startsWith('uploads/')) {
            const abs = path.join(__dirname, '../public', rel);
            exists = fs.existsSync(abs);
            if (exists) {
                try { fileSize = fs.statSync(abs).size; } catch {}
            }
        }
        refs.push({ type, id, field, value, isExternal, exists, fileSize, title: title || '' });
    };

    const [services, partners, projects, posts] = await Promise.all([
        require('../models/Service').findAll(),
        require('../models/Partner').findAll(),
        require('../models/Project').findAll(),
        require('../models/Post').findAll()
    ]);
    services.forEach(s => pushRef('Service', s.id, 'image', s.image, s.title_ar || s.title_en));
    partners.forEach(p => pushRef('Partner', p.id, 'logo', p.logo, p.name));
    projects.forEach(pj => pushRef('Project', pj.id, 'image', pj.image, pj.title));
    posts.forEach(po => pushRef('Post', po.id, 'image', po.image, po.title));
    return refs;
};

exports.getAssetsAudit = async (req, res) => {
    try {
        const refs = await collectAssetRefs();
        const total = refs.length;
        const missing = refs.filter(r => !r.isExternal && !r.exists);
        res.render('admin/assets-audit', {
            title: 'لوحة التحكم | تدقيق الأصول ومزامنتها',
            path: '/admin/assets/audit',
            refs,
            stats: { total, missing: missing.length }
        });
    } catch (e) {
        console.error(e);
        res.status(500).send('Server Error');
    }
};

exports.postAssetsUpload = async (req, res) => {
    try {
        const filename = (req.params.filename || '').replace(/[^a-zA-Z0-9._-]/g, '');
        if (!filename || !req.file) {
            return res.status(400).send('Bad Request');
        }
        debugLog(`ASSET UPLOAD: ${filename} -> OK`);
        res.redirect('/admin/assets/audit');
    } catch (e) {
        console.error(e);
        res.status(500).send('Server Error');
    }
};

// --- SEO Settings ---
exports.getSeoSettings = async (req, res) => {
    try {
        let seo = await GlobalSeo.findOne();
        if (!seo) {
            seo = await GlobalSeo.create({});
        }
        res.render('admin/seo', { title: 'لوحة التحكم | إعدادات SEO', seo, path: '/admin/seo' });
    } catch (error) {
        console.error(error);
        res.status(500).send('Server Error');
    }
};

exports.getDesignSettings = async (req, res) => {
    try {
        let seo = await GlobalSeo.findOne();
        if (!seo) {
            seo = await GlobalSeo.create({});
        }
        res.render('admin/design', { title: 'لوحة التحكم | إعدادات التصميم', seo, path: '/admin/design' });
    } catch (error) {
        console.error(error);
        res.status(500).send('Server Error');
    }
};

exports.postDesignSettings = async (req, res) => {
    try {
        let seo = await GlobalSeo.findOne();
        const data = { ...req.body };

        // Handle checkbox
        data.sliderAutoplay = req.body.sliderAutoplay === 'on';

        if (!seo) {
            seo = await GlobalSeo.create(data);
        } else {
            await seo.update(data);
        }
        res.redirect('/admin/design');
    } catch (error) {
        console.error(error);
        res.status(500).send('Server Error');
    }
};

// --- Partner Management ---
exports.managePartners = async (req, res) => {
    try {
        const partners = await Partner.findAll({ order: [['display_order', 'ASC']] });
        res.render('admin/partners-manage', { 
            title: 'لوحة التحكم | إدارة الشركاء', 
            partners,
            path: '/admin/partners'
        });
    } catch (error) {
        console.error(error);
        res.status(500).send('Server Error');
    }
};

exports.getAddPartner = (req, res) => {
    res.render('admin/partner-form', { 
        title: 'لوحة التحكم | إضافة شريك', 
        partner: null,
        path: '/admin/partners'
    });
};

exports.postAddPartner = async (req, res) => {
    try {
        const { name, display_order, is_active, existingLogo } = req.body;
        let logo = null;
        if (existingLogo) logo = existingLogo;
        else if (req.file) logo = await toHashedAsset(req.file);

        await Partner.create({
            name,
            logo,
            display_order: display_order || 0,
            is_active: is_active === 'on'
        });

        res.redirect('/admin/partners');
    } catch (error) {
        console.error(error);
        res.status(500).send('Server Error');
    }
};

exports.getEditPartner = async (req, res) => {
    try {
        const partner = await Partner.findByPk(req.params.id);
        if (!partner) return res.redirect('/admin/partners');
        res.render('admin/partner-form', { 
            title: 'لوحة التحكم | تعديل شريك', 
            partner,
            path: '/admin/partners'
        });
    } catch (error) {
        console.error(error);
        res.status(500).send('Server Error');
    }
};

exports.postEditPartner = async (req, res) => {
    try {
        const { name, display_order, is_active, existingLogo } = req.body;
        const partner = await Partner.findByPk(req.params.id);
        if (!partner) return res.redirect('/admin/partners');

        let logo = partner.logo;
        if (existingLogo) {
            logo = existingLogo;
        } else if (req.file) {
            logo = await toHashedAsset(req.file);
        }

        await partner.update({
            name,
            logo,
            display_order: display_order || 0,
            is_active: is_active === 'on'
        });

        res.redirect('/admin/partners');
    } catch (error) {
        console.error(error);
        res.status(500).send('Server Error');
    }
};

exports.deletePartner = async (req, res) => {
    try {
        const partner = await Partner.findByPk(req.params.id);
        if (partner) {
            deleteFile(partner.logo);
            await partner.destroy();
        }
        res.redirect('/admin/partners');
    } catch (error) {
        console.error(error);
        res.status(500).send('Server Error');
    }
};

exports.postSeoSettings = async (req, res) => {
    try {
        let seo = await GlobalSeo.findOne();
        const data = { ...req.body };

        // Handle file uploads
        if (req.files) {
            if (req.files['favicon']) {
                data.favicon = await toHashedAsset(req.files['favicon'][0]);
            }
            if (req.files['ogImage']) {
                data.ogImage = await toHashedAsset(req.files['ogImage'][0]);
            }
        }

        if (!seo) {
            seo = await GlobalSeo.create(data);
        } else {
            await seo.update(data);
        }
        res.redirect('/admin/seo');
    } catch (error) {
        console.error(error);
        res.status(500).send('Server Error');
    }
};

// --- Portfolio Management ---
exports.managePortfolio = async (req, res) => {
    try {
        const projects = await Project.findAll();
        res.render('admin/portfolio-manage', { title: 'لوحة التحكم | إدارة الأعمال', projects });
    } catch (error) {
        console.error(error);
        res.render('admin/portfolio-manage', { title: 'لوحة التحكم | إدارة الأعمال', projects: [] });
    }
};

exports.getAddProject = async (req, res) => {
    try {
        const categories = await Category.findAll({ order: [['display_order', 'ASC']] });
        res.render('admin/portfolio-form', {
            title: 'إضافة مشروع جديد',
            project: null,
            categories,
            path: '/admin/portfolio'
        });
    } catch (error) {
        console.error(error);
        res.status(500).send('Server Error');
    }
};

exports.postAddProject = async (req, res) => {
    try {
        const { title, description, content, externalLink, category, display_order, is_active, seoTitle, seoDescription, seoKeywords, existingImage } = req.body;
        const data = {
            title,
            description,
            content,
            externalLink,
            category,
            display_order: display_order || 0,
            is_active: is_active === 'on',
            seoTitle,
            seoDescription,
            seoKeywords
        };

        if (existingImage) {
            data.image = existingImage;
        } else if (req.file) {
            data.image = await toHashedAsset(req.file);
        }

        // Handle CategoryId
        if (data.category && !isNaN(data.category)) {
            data.CategoryId = parseInt(data.category);
            const cat = await Category.findByPk(data.CategoryId);
            if (cat) data.category = cat.slug;
        }

        await Project.create(data);
        res.redirect('/admin/portfolio');
    } catch (error) {
        console.error(error);
        res.status(500).send('Server Error');
    }
};

// --- Category Management ---
exports.manageCategories = async (req, res) => {
    try {
        const categories = await Category.findAll({ order: [['display_order', 'ASC']] });
        res.render('admin/categories-manage', { 
            title: 'لوحة التحكم | إدارة التصنيفات', 
            categories,
            path: '/admin/categories'
        });
    } catch (error) {
        console.error(error);
        res.status(500).send('Server Error');
    }
};

exports.getAddCategory = (req, res) => {
    res.render('admin/category-form', { 
        title: 'لوحة التحكم | إضافة تصنيف', 
        category: null,
        path: '/admin/categories'
    });
};

exports.postAddCategory = async (req, res) => {
    try {
        const { name, slug, description, display_order } = req.body;
        await Category.create({
            name,
            slug: slug || name.toLowerCase().replace(/ /g, '-'),
            description,
            display_order: display_order || 0
        });
        
        const backURL = req.header('Referer') || '/admin/portfolio';
        res.redirect(backURL);
    } catch (error) {
        console.error(error);
        res.status(500).send('Server Error');
    }
};

exports.getEditCategory = async (req, res) => {
    try {
        const category = await Category.findByPk(req.params.id);
        if (!category) return res.redirect('/admin/categories');
        res.render('admin/category-form', { 
            title: 'لوحة التحكم | تعديل تصنيف', 
            category,
            path: '/admin/categories'
        });
    } catch (error) {
        console.error(error);
        res.status(500).send('Server Error');
    }
};

exports.postEditCategory = async (req, res) => {
    try {
        const { name, slug, description, display_order } = req.body;
        const category = await Category.findByPk(req.params.id);
        if (!category) return res.redirect('/admin/categories');

        await category.update({
            name,
            slug: slug || name.toLowerCase().replace(/ /g, '-'),
            description,
            display_order: display_order || 0
        });

        res.redirect('/admin/categories');
    } catch (error) {
        console.error(error);
        res.status(500).send('Server Error');
    }
};

exports.deleteCategory = async (req, res) => {
    try {
        const category = await Category.findByPk(req.params.id);
        if (category) {
            await category.destroy();
        }
        res.redirect('/admin/categories');
    } catch (error) {
        console.error(error);
        res.status(500).send('Server Error');
    }
};

exports.getEditProject = async (req, res) => {
    try {
        const project = await Project.findByPk(req.params.id);
        if (!project) return res.redirect('/admin/portfolio');
        const categories = await Category.findAll({ order: [['display_order', 'ASC']] });
        res.render('admin/portfolio-form', {
            title: 'تعديل المشروع',
            project,
            categories,
            path: '/admin/portfolio'
        });
    } catch (error) {
        console.error(error);
        res.status(500).send('Server Error');
    }
};

exports.postEditProject = async (req, res) => {
    try {
        const { id } = req.params;
        const project = await Project.findByPk(id);
        if (!project) return res.redirect('/admin/portfolio');

        const { title, description, content, externalLink, category, display_order, is_active, seoTitle, seoDescription, seoKeywords, existingImage } = req.body;
        const data = {
            title,
            description,
            content,
            externalLink,
            category,
            display_order: display_order || 0,
            is_active: is_active === 'on',
            seoTitle,
            seoDescription,
            seoKeywords
        };

        if (existingImage) {
            data.image = existingImage;
        } else if (req.file) {
            data.image = await toHashedAsset(req.file);
        }

        // Handle CategoryId
        if (data.category && !isNaN(data.category)) {
            data.CategoryId = parseInt(data.category);
            const cat = await Category.findByPk(data.CategoryId);
            if (cat) data.category = cat.slug;
        }

        await project.update(data);
        res.redirect('/admin/portfolio');
    } catch (error) {
        console.error(error);
        res.status(500).send('Server Error');
    }
};

exports.deleteProject = async (req, res) => {
    try {
        const project = await Project.findByPk(req.params.id);
        deleteFile(project.image);
        await project.destroy();
        res.redirect('/admin/portfolio');
    } catch (error) {
        console.error(error);
        res.status(500).send('Server Error');
    }
};

// --- Blog Management ---
exports.manageBlog = async (req, res) => {
    try {
        const posts = await Post.findAll();
        res.render('admin/blog-manage', { title: 'لوحة التحكم | إدارة المدونة', posts });
    } catch (error) {
        console.error(error);
        res.render('admin/blog-manage', { title: 'لوحة التحكم | إدارة المدونة', posts: [] });
    }
};

exports.getAddPost = (req, res) => {
    res.render('admin/blog-form', { title: 'إضافة مقال جديد', post: null });
};

exports.postAddPost = async (req, res) => {
    try {
        const { title, excerpt, content, date, is_active, seoTitle, seoDescription, seoKeywords, existingImage } = req.body;
        const data = {
            title,
            excerpt,
            content,
            date,
            is_active: is_active === 'on',
            seoTitle,
            seoDescription,
            seoKeywords
        };
        if (existingImage) {
            data.image = existingImage;
        } else if (req.file) {
            data.image = await toHashedAsset(req.file);
        }
        await Post.create(data);
        res.redirect('/admin/blog');
    } catch (error) {
        console.error(error);
        res.status(500).send('Server Error');
    }
};

exports.getEditPost = async (req, res) => {
    try {
        const post = await Post.findByPk(req.params.id);
        res.render('admin/blog-form', { title: 'تعديل المقال', post });
    } catch (error) {
        console.error(error);
        res.status(500).send('Server Error');
    }
};

exports.postEditPost = async (req, res) => {
    try {
        const { title, excerpt, content, date, is_active, seoTitle, seoDescription, seoKeywords, existingImage } = req.body;
        const post = await Post.findByPk(req.params.id);
        const data = {
            title,
            excerpt,
            content,
            date,
            is_active: is_active === 'on',
            seoTitle,
            seoDescription,
            seoKeywords
        };
        if (existingImage) {
            data.image = existingImage;
        } else if (req.file) {
            data.image = await toHashedAsset(req.file);
        }
        await post.update(data);
        res.redirect('/admin/blog');
    } catch (error) {
        console.error(error);
        res.status(500).send('Server Error');
    }
};

exports.deletePost = async (req, res) => {
    try {
        const post = await Post.findByPk(req.params.id);
        deleteFile(post.image);
        await post.destroy();
        res.redirect('/admin/blog');
    } catch (error) {
        console.error(error);
        res.status(500).send('Server Error');
    }
};

// --- Services Management ---
exports.manageServices = async (req, res) => {
    try {
        const services = await Service.findAll({ order: [['display_order', 'ASC']] });
        res.render('admin/services-manage', { title: 'إدارة الخدمات', services });
    } catch (error) {
        console.error(error);
        res.status(500).send('Server Error');
    }
};

exports.getAddService = (req, res) => {
    res.render('admin/service-form', { title: 'إضافة خدمة', service: null });
};

exports.postAddService = async (req, res) => {
    try {
        const { 
            title_ar, title_en, description_ar, description_en, 
            display_order, is_active, seoTitle, seoDescription, seoKeywords,
            tag1_ar, tag2_ar, tag3_ar, tag1_en, tag2_en, tag3_en,
            existingImage
        } = req.body;
        let image = null;
        if (existingImage) image = existingImage;
        else if (req.file) image = await toHashedAsset(req.file);

        await Service.create({
            title_ar,
            title_en,
            description_ar,
            description_en,
            image,
            display_order: display_order || 0,
            is_active: is_active === 'on',
            tag1_ar,
            tag2_ar,
            tag3_ar,
            tag1_en,
            tag2_en,
            tag3_en,
            seoTitle,
            seoDescription,
            seoKeywords
        });

        res.redirect('/admin/services');
    } catch (error) {
        console.error(error);
        res.status(500).send('Server Error');
    }
};

// --- Contact Management ---
exports.manageContacts = async (req, res) => {
    try {
        const contacts = await Contact.findAll({ order: [['createdAt', 'DESC']] });
        res.render('admin/contacts-manage', { title: 'لوحة التحكم | استمارات التواصل', contacts });
    } catch (error) {
        console.error(error);
        res.render('admin/contacts-manage', { title: 'لوحة التحكم | استمارات التواصل', contacts: [] });
    }
};

exports.deleteContact = async (req, res) => {
    try {
        const contact = await Contact.findByPk(req.params.id);
        if (contact) {
            await contact.destroy();
        }
        res.redirect('/admin/contacts');
    } catch (error) {
        console.error(error);
        res.status(500).send('Server Error');
    }
};

exports.updateContactStatus = async (req, res) => {
    try {
        const { status } = req.body;
        const contact = await Contact.findByPk(req.params.id);
        if (contact) {
            await contact.update({ status });
        }
        res.json({ success: true });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false });
    }
};

exports.getEditService = async (req, res) => {
    try {
        const service = await Service.findByPk(req.params.id);
        if (!service) return res.status(404).send('Service not found');
        res.render('admin/service-form', { title: 'تعديل خدمة', service });
    } catch (error) {
        console.error(error);
        res.status(500).send('Server Error');
    }
};

exports.postEditService = async (req, res) => {
    try {
        const { 
            title_ar, title_en, description_ar, description_en, 
            display_order, is_active, seoTitle, seoDescription, seoKeywords,
            tag1_ar, tag2_ar, tag3_ar, tag1_en, tag2_en, tag3_en,
            existingImage
        } = req.body;
        const service = await Service.findByPk(req.params.id);
        if (!service) return res.redirect('/admin/services');

        let image = service.image;
        if (existingImage) {
            image = existingImage;
        } else if (req.file) {
            image = await toHashedAsset(req.file);
        }

        await service.update({
            title_ar,
            title_en,
            description_ar,
            description_en,
            image,
            display_order: display_order || 0,
            is_active: is_active === 'on',
            tag1_ar,
            tag2_ar,
            tag3_ar,
            tag1_en,
            tag2_en,
            tag3_en,
            seoTitle,
            seoDescription,
            seoKeywords
        });

        res.redirect('/admin/services');
    } catch (error) {
        console.error(error);
        res.status(500).send('Server Error');
    }
};

exports.deleteService = async (req, res) => {
    try {
        const service = await Service.findByPk(req.params.id);
        if (service) {
            deleteFile(service.image);
            await service.destroy();
        }
        res.redirect('/admin/services');
    } catch (error) {
        console.error(error);
        res.status(500).send('Server Error');
    }
};
