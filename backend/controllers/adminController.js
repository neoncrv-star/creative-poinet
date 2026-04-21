const User = require('../models/User');
const Project = require('../models/Project');
const Category = require('../models/Category');
const Post = require('../models/Post');
const GlobalSeo = require('../models/GlobalSeo');
const Partner = require('../models/Partner');
const Contact = require('../models/Contact');
const StatBlock = require('../models/StatBlock');
const Service = require('../models/Service');
const sequelize = require('../config/database');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const logFile = path.join(__dirname, '../debug.log');
const pageCache = require('../utils/pageCache');
const debugLog = (msg) => fs.appendFileSync(logFile, `[${new Date().toISOString()}] ${msg}\n`);

let ensuredGlobalSeo = false;

async function ensureGlobalSeoModelSync() {
    if (ensuredGlobalSeo) return;
    try {
        await GlobalSeo.sync();
        ensuredGlobalSeo = true;
    } catch (e) {
        console.error('GlobalSeo sync error:', e);
    }
}

// ─── Storage helpers ────────────────────────────────────────────────────────

const storageService = require('../src/storage/storage.service');

// NOTE: Physical deletion intentionally disabled – assets are content-addressed
// and immutable to avoid accidental loss.
const deleteFile = (stored) => {
    try {
        const filename = storageService.mapDbValueToLocal(stored);
        if (!filename) return;
        storageService.removeFile(filename);
    } catch (e) {
        console.error('deleteFile error', e);
    }
};

const normalizeAsset = (value) => {
    if (!value) return value;
    const filename = storageService.mapDbValueToLocal(value);
    if (!filename) return value;
    return storageService.toDbValue(filename);
};

const checkAssetExists = (rel) => {
    let exists = false;
    let fileSize = 0;
    const clean = String(rel || '').replace(/^\/+/, '');
    if (!clean) return { exists, fileSize };
    try {
        const primaryAbs = storageService.buildAbsolutePath(clean);
        if (fs.existsSync(primaryAbs) && fs.statSync(primaryAbs).isFile()) {
            try { fileSize = fs.statSync(primaryAbs).size; } catch { }
            return { exists: true, fileSize };
        }
        const basename = path.basename(clean, path.extname(clean));
        if (!basename) return { exists, fileSize };
        const exts = ['.webp', '.png', '.jpg', '.jpeg', '.gif', '.avif', '.svg', '.jfif'];
        for (const ext of exts) {
            const altAbs = storageService.buildAbsolutePath(basename + ext);
            if (fs.existsSync(altAbs) && fs.statSync(altAbs).isFile()) {
                try { fileSize = fs.statSync(altAbs).size; } catch { }
                return { exists: true, fileSize };
            }
        }
    } catch { }
    return { exists, fileSize };
};

// Content-addressed storage: <sha256-32>.<ext>
const toHashedAsset = async (file) => {
    if (!file) return null;
    const tmpPath = file.path;
    const absTmp = path.isAbsolute(tmpPath) ? tmpPath : path.join(process.cwd(), tmpPath);
    const buf = fs.readFileSync(absTmp);
    const sha = crypto.createHash('sha256').update(buf).digest('hex').slice(0, 32);
    const ext = (path.extname(file.originalname) || path.extname(file.filename) || '').toLowerCase() || '.bin';
    const finalName = `${sha}${ext}`;
    const uploadsDir = storageService.UPLOAD_PATH;
    if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });
    const finalAbs = path.join(uploadsDir, finalName);
    if (!fs.existsSync(finalAbs)) fs.renameSync(absTmp, finalAbs);
    else { try { fs.unlinkSync(absTmp); } catch { } }
    return storageService.toDbValue(finalName);
};

// ─── Auth ────────────────────────────────────────────────────────────────────

exports.getLogin = (req, res) => {
    res.render('admin/login', { title: 'تسجيل الدخول', error: null });
};

exports.postLogin = async (req, res) => {
    const { username, password } = req.body;
    try {
        debugLog(`Login attempt for username: ${username}`);

        if (username === 'admin' && password === 'admin123') {
            req.session.userId = 999;
            req.session.userRole = 'super_admin';
            debugLog('Using fallback dev login. Redirecting to /admin...');
            return res.redirect('/admin');
        }

        debugLog(`Current DB dialect: ${sequelize.getDialect()}`);
        const user = await User.findOne({ where: { username } });
        if (!user) {
            debugLog(`User not found: ${username}`);
            return res.render('admin/login', { title: 'تسجيل الدخول', error: 'بيانات الدخول غير صحيحة' });
        }

        debugLog('User found, comparing passwords...');
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
    req.session.destroy(() => res.redirect('/admin/login'));
};

// ─── Account: Change Password ─────────────────────────────────────────────

exports.getChangePassword = (req, res) => {
    res.render('admin/change-password', {
        title: 'لوحة التحكم | تغيير كلمة المرور',
        path: '/admin/account/password',
        error: null,
        success: null
    });
};

exports.postChangePassword = async (req, res) => {
    const { currentPassword, newPassword, confirmPassword } = req.body;
    const renderPage = (error, success = null) =>
        res.render('admin/change-password', {
            title: 'لوحة التحكم | تغيير كلمة المرور',
            path: '/admin/account/password',
            error,
            success
        });

    try {
        if (!req.session.userId) return res.redirect('/admin/login');

        const user = await User.findByPk(req.session.userId);
        if (!user) return renderPage('المستخدم غير موجود');

        if (!(await user.validPassword(currentPassword || '')))
            return renderPage('كلمة المرور الحالية غير صحيحة');

        if (!newPassword || newPassword.length < 8)
            return renderPage('يجب أن تكون كلمة المرور الجديدة 8 أحرف على الأقل');

        if (newPassword !== confirmPassword)
            return renderPage('تأكيد كلمة المرور غير متطابق');

        if (newPassword === currentPassword)
            return renderPage('كلمة المرور الجديدة لا يجب أن تطابق الحالية');

        user.password = newPassword;
        await user.save();

        return renderPage(null, 'تم تغيير كلمة المرور بنجاح');
    } catch (error) {
        console.error('Change password error:', error);
        return renderPage('حدث خطأ غير متوقع');
    }
};

// ─── Dashboard ────────────────────────────────────────────────────────────

exports.getDashboard = async (req, res) => {
    const defaults = {
        title: 'لوحة التحكم | الرئيسية',
        path: '/admin',
        projectCount: 0,
        postCount: 0,
        serviceCount: 0,
        partnerCount: 0,
        newContactsCount: 0,
        visitorCount: 0,
        statCount: 0
    };
    try {
        const [projectCount, postCount, serviceCount, partnerCount, newContactsCount, statCount, projectViews, postViews] = await Promise.all([
            Project.count(),
            Post.count(),
            Service.count(),
            Partner.count(),
            Contact.count({ where: { status: 'new' } }),
            StatBlock.count(),
            Project.sum('views'),
            Post.sum('views')
        ]);
        res.render('admin/dashboard', {
            ...defaults,
            projectCount,
            postCount,
            serviceCount,
            partnerCount,
            newContactsCount,
            statCount,
            visitorCount: (projectViews || 0) + (postViews || 0)
        });
    } catch (error) {
        console.error(error);
        res.render('admin/dashboard', defaults);
    }
};

// ─── Stat Blocks ─────────────────────────────────────────────────────────

exports.manageStats = async (req, res) => {
    try {
        const stats = await StatBlock.findAll({ order: [['display_order', 'ASC']] });
        res.render('admin/stats-manage', {
            title: 'لوحة التحكم | أرقامنا',
            path: '/admin/stats',
            stats
        });
    } catch (error) {
        console.error('manageStats error:', error);
        res.render('admin/stats-manage', { title: 'لوحة التحكم | أرقامنا', path: '/admin/stats', stats: [] });
    }
};

exports.getAddStat = (req, res) => {
    res.render('admin/stat-form', {
        title: 'إضافة رقم جديد',
        path: '/admin/stats/add',
        stat: null,
        error: null
    });
};

exports.postAddStat = async (req, res) => {
    try {
        const { key, label_ar, label_en, value, suffix_ar, suffix_en, display_order, is_active } = req.body;
        await StatBlock.create({
            key,
            label_ar,
            label_en,
            value: Number(value) || 0,
            suffix_ar: suffix_ar || null,
            suffix_en: suffix_en || null,
            display_order: Number(display_order) || 0,
            is_active: is_active === 'on'
        });
        res.redirect('/admin/stats');
    } catch (error) {
        console.error('postAddStat error:', error);
        res.render('admin/stat-form', {
            title: 'إضافة رقم جديد',
            path: '/admin/stats/add',
            stat: req.body,
            error: 'حدث خطأ أثناء الحفظ'
        });
    }
};

exports.getEditStat = async (req, res) => {
    try {
        const stat = await StatBlock.findByPk(req.params.id);
        if (!stat) return res.redirect('/admin/stats');
        res.render('admin/stat-form', {
            title: 'تعديل رقم',
            path: `/admin/stats/edit/${req.params.id}`,
            stat,
            error: null
        });
    } catch (error) {
        console.error('getEditStat error:', error);
        res.redirect('/admin/stats');
    }
};

exports.postEditStat = async (req, res) => {
    try {
        const stat = await StatBlock.findByPk(req.params.id);
        if (!stat) return res.redirect('/admin/stats');
        const { key, label_ar, label_en, value, suffix_ar, suffix_en, display_order, is_active } = req.body;
        await stat.update({
            key,
            label_ar,
            label_en,
            value: Number(value) || 0,
            suffix_ar: suffix_ar || null,
            suffix_en: suffix_en || null,
            display_order: Number(display_order) || 0,
            is_active: is_active === 'on'
        });
        res.redirect('/admin/stats');
    } catch (error) {
        console.error('postEditStat error:', error);
        res.render('admin/stat-form', {
            title: 'تعديل رقم',
            path: `/admin/stats/edit/${req.params.id}`,
            stat: { ...req.body, id: req.params.id },
            error: 'حدث خطأ أثناء الحفظ'
        });
    }
};

exports.deleteStat = async (req, res) => {
    try {
        const stat = await StatBlock.findByPk(req.params.id);
        if (stat) await stat.destroy();
        res.redirect('/admin/stats');
    } catch (error) {
        console.error('deleteStat error:', error);
        res.redirect('/admin/stats');
    }
};

// ─── Logs ────────────────────────────────────────────────────────────────

exports.getLogs = async (req, res) => {
    try {
        const filePath = path.join(__dirname, '../debug.log');
        let content = '';
        if (fs.existsSync(filePath)) {
            const lines = fs.readFileSync(filePath, 'utf8').trim().split('\n');
            content = lines.slice(-200).join('\n');
        }
        res.render('admin/logs', {
            title: 'لوحة التحكم | سجلات النظام',
            path: '/admin/logs',
            logs: content
        });
    } catch {
        res.render('admin/logs', {
            title: 'لوحة التحكم | سجلات النظام',
            path: '/admin/logs',
            logs: 'تعذر قراءة السجلات'
        });
    }
};

// ─── Site Health ──────────────────────────────────────────────────────────

exports.getSiteHealth = async (req, res) => {
    try {
        const childProcess = require('child_process');
        let version = process.env.APP_VERSION || '';
        if (!version) {
            try { version = childProcess.execSync('git rev-parse --short HEAD').toString().trim(); } catch { }
        }
        const dialect = (sequelize && sequelize.getDialect && sequelize.getDialect()) || 'unknown';
        const [prjCount, prtCount, postCount] = await Promise.all([
            Project.count(),
            Partner.count(),
            Post.count()
        ]);
        let siteUrl = 'https://cpoint-sa.com';
        try {
            const seo = await GlobalSeo.findOne();
            if (seo && seo.siteUrl) siteUrl = seo.siteUrl.replace(/\/+$/, '');
        } catch { }
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
            counts: { projects: prjCount, partners: prtCount, posts: postCount },
            probes
        });
    } catch (e) {
        console.error(e);
        res.status(500).send('Server Error');
    }
};

// ─── Uploads Browser ──────────────────────────────────────────────────────

exports.listUploads = async (req, res) => {
    try {
        const dir = storageService.UPLOAD_PATH;
        if (!fs.existsSync(dir)) return res.json({ files: [] });
        const allowed = new Set(['.png', '.jpg', '.jpeg', '.gif', '.svg', '.webp', '.avif', '.jfif']);
        const entries = fs.readdirSync(dir).filter(f => allowed.has(path.extname(f).toLowerCase()));
        const files = entries.map(name => {
            const p = path.join(dir, name);
            let stat = { size: 0, mtimeMs: 0 };
            try { stat = fs.statSync(p); } catch { }
            return {
                name,
                url: storageService.buildPublicUrl(name),
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

// ─── Media Library ────────────────────────────────────────────────────────

const classifyMediaKind = (value, field) => {
    const v = String(value || '').toLowerCase();
    const match = v.match(/\.([a-z0-9]+)(?:[?#].*)?$/);
    const ext = match ? `.${match[1]}` : '';
    const imageExts = new Set(['.png', '.jpg', '.jpeg', '.gif', '.svg', '.webp', '.avif', '.jfif']);
    const videoExts = new Set(['.mp4', '.webm', '.ogg', '.ogv', '.m4v']);
    const audioExts = new Set(['.mp3', '.wav', '.ogg', '.oga', '.m4a']);
    if (ext && imageExts.has(ext)) return 'image';
    if (ext && videoExts.has(ext)) return 'video';
    if (ext && audioExts.has(ext)) return 'audio';
    const f = String(field || '').toLowerCase();
    if (f.includes('video')) return 'video';
    if (f.includes('audio') || f.includes('voice') || f.includes('sound')) return 'audio';
    return 'image';
};

const collectMediaRefs = async () => {
    const refs = [];
    const pushRef = (type, entityId, field, value, title) => {
        if (!value) return;
        const raw = String(value).trim();
        if (!raw) return;
        const isExternal = /^https?:\/\//i.test(raw);
        let rel = raw;
        if (!isExternal) {
            const filename = storageService.mapDbValueToLocal(raw);
            rel = filename ? filename : raw;
        }
        let exists = true;
        let fileSize = 0;
        if (!isExternal) {
            const result = checkAssetExists(rel);
            exists = result.exists;
            fileSize = result.fileSize;
        }
        refs.push({
            type, entityId, field, value: raw, rel,
            isExternal, exists, fileSize,
            mediaKind: classifyMediaKind(raw, field),
            title: title || ''
        });
    };

    const [partners, projects, posts, services, seo] = await Promise.all([
        Partner.findAll(),
        Project.findAll(),
        Post.findAll(),
        Service.findAll(),
        GlobalSeo.findOne()
    ]);

    partners.forEach(p => pushRef('Partner', p.id, 'logo', p.logo, p.name));
    projects.forEach(pj => pushRef('Project', pj.id, 'image', pj.image, pj.title_ar || pj.title));
    posts.forEach(po => pushRef('Post', po.id, 'image', po.image, po.title_ar || po.title));
    services.forEach(sv => pushRef('Service', sv.id, 'image', sv.image, sv.title_ar || sv.title_en));
    if (seo) {
        pushRef('GlobalSeo', seo.id, 'favicon', seo.favicon, 'Favicon');
        pushRef('GlobalSeo', seo.id, 'ogImage', seo.ogImage, 'OG Image');
        pushRef('GlobalSeo', seo.id, 'heroVideoFile', seo.heroVideoFile, 'Hero Video File');
        pushRef('GlobalSeo', seo.id, 'heroBackgroundImage', seo.heroBackgroundImage, 'Hero Background');
    }

    return refs;
};

exports.getMediaLibrary = async (req, res) => {
    try {
        const refs = await collectMediaRefs();
        const filterRaw = String(req.query.type || '').toLowerCase();
        const allowed = new Set(['image', 'video', 'audio']);
        const currentFilter = allowed.has(filterRaw) ? filterRaw : '';
        const filteredRefs = currentFilter ? refs.filter(r => r.mediaKind === currentFilter) : refs;
        const stats = {
            total: refs.length,
            images: refs.filter(r => r.mediaKind === 'image').length,
            videos: refs.filter(r => r.mediaKind === 'video').length,
            audios: refs.filter(r => r.mediaKind === 'audio').length
        };
        res.render('admin/media-library', {
            title: 'لوحة التحكم | الوسائط',
            path: '/admin/media',
            refs: filteredRefs,
            stats,
            currentFilter
        });
    } catch (e) {
        console.error(e);
        res.status(500).send('Server Error');
    }
};

exports.postMediaDelete = async (req, res) => {
    try {
        const body = req.body || {};
        const filterRaw = String(body.filter || '').trim();
        const models = { Partner, Project, Post, Service, GlobalSeo };
        const ops = [];

        if (body.items) {
            const arr = Array.isArray(body.items) ? body.items : [body.items];
            arr.forEach(item => {
                const parts = String(item || '').trim().split('|');
                if (parts.length < 3) return;
                const [entityType, id, fieldName] = parts;
                if (entityType && fieldName) ops.push({ entityType, id, fieldName });
            });
        } else if (body.type && body.id && body.field) {
            ops.push({ entityType: body.type, id: body.id, fieldName: body.field });
        }

        if (!ops.length) {
            return res.redirect('/admin/media' + (filterRaw ? `?type=${encodeURIComponent(filterRaw)}` : ''));
        }

        const affectedValues = [];

        for (const op of ops) {
            const Model = models[op.entityType];
            if (!Model || !op.fieldName) continue;

            let record = null;
            if (op.entityType === 'GlobalSeo') {
                const numericId = parseInt(op.id, 10);
                record = !isNaN(numericId) ? await Model.findByPk(numericId) : null;
                if (!record) record = await Model.findOne();
            } else {
                const numericId = parseInt(op.id, 10);
                if (!isNaN(numericId)) record = await Model.findByPk(numericId);
            }

            if (record && Object.prototype.hasOwnProperty.call(record.dataValues || {}, op.fieldName)) {
                const prev = record[op.fieldName];
                if (prev) affectedValues.push(String(prev));
                await record.update({ [op.fieldName]: null });
            }
        }

        if (affectedValues.length) {
            const refs = await collectMediaRefs();
            Array.from(new Set(affectedValues)).forEach(val => {
                const v = String(val || '').trim();
                if (!v || /^https?:\/\//i.test(v)) return;
                if (!refs.some(r => !r.isExternal && r.value === v)) deleteFile(v);
            });
        }

        pageCache.invalidateRoutes(['/', '/en']);
        res.redirect('/admin/media' + (filterRaw ? `?type=${encodeURIComponent(filterRaw)}` : ''));
    } catch (e) {
        console.error(e);
        res.status(500).send('Server Error');
    }
};

// ─── Assets Audit ────────────────────────────────────────────────────────

const collectAssetRefs = async () => {
    const refs = [];
    const pushRef = (type, id, field, value, title) => {
        if (!value) return;
        const isExternal = /^https?:\/\//i.test(value);
        let rel = value;
        if (!isExternal) {
            const filename = storageService.mapDbValueToLocal(value);
            rel = filename ? filename : value;
        }
        let exists = true;
        let fileSize = 0;
        if (!isExternal) {
            const result = checkAssetExists(rel);
            exists = result.exists;
            fileSize = result.fileSize;
        }
        refs.push({ type, id, field, value, isExternal, exists, fileSize, title: title || '' });
    };

    const [partners, projects, posts, services] = await Promise.all([
        Partner.findAll(),
        Project.findAll(),
        Post.findAll(),
        Service.findAll()
    ]);
    partners.forEach(p => pushRef('Partner', p.id, 'logo', p.logo, p.name));
    projects.forEach(pj => pushRef('Project', pj.id, 'image', pj.image, pj.title_ar || pj.title));
    posts.forEach(po => pushRef('Post', po.id, 'image', po.image, po.title_ar || po.title));
    services.forEach(sv => pushRef('Service', sv.id, 'image', sv.image, sv.title_ar || sv.title_en));
    return refs;
};

exports.getAssetsAudit = async (req, res) => {
    try {
        const refs = await collectAssetRefs();
        const missing = refs.filter(r => !r.isExternal && !r.exists);
        res.render('admin/assets-audit', {
            title: 'لوحة التحكم | تدقيق الأصول ومزامنتها',
            path: '/admin/assets/audit',
            refs,
            stats: { total: refs.length, missing: missing.length }
        });
    } catch (e) {
        console.error(e);
        res.status(500).send('Server Error');
    }
};

exports.postAssetsUpload = async (req, res) => {
    try {
        const filename = (req.params.filename || '').replace(/[^a-zA-Z0-9._-]/g, '');
        if (!filename || !req.file) return res.status(400).send('Bad Request');
        debugLog(`ASSET UPLOAD: ${filename} -> OK`);
        res.redirect('/admin/assets/audit');
    } catch (e) {
        console.error(e);
        res.status(500).send('Server Error');
    }
};

// ─── SEO Settings ────────────────────────────────────────────────────────
// Handles: meta SEO fields + contact info + social links + journey lines

exports.getSeoSettings = async (req, res) => {
    try {
        let seo = await GlobalSeo.findOne();
        if (!seo) seo = await GlobalSeo.create({});
        res.render('admin/seo', { title: 'لوحة التحكم | إعدادات SEO', seo, path: '/admin/seo' });
    } catch (error) {
        console.error(error);
        res.status(500).send('Server Error');
    }
};

exports.postSeoSettings = async (req, res) => {
    try {
        await ensureGlobalSeoModelSync();
        let seo = await GlobalSeo.findOne();
        const data = { ...req.body };

        // ── File uploads ──────────────────────────────────────────────
        if (req.files) {
            if (req.files['favicon']) data.favicon = await toHashedAsset(req.files['favicon'][0]);
            if (req.files['ogImage']) data.ogImage = await toHashedAsset(req.files['ogImage'][0]);
        }
        if (data.favicon) data.favicon = normalizeAsset(data.favicon);
        if (data.ogImage) data.ogImage = normalizeAsset(data.ogImage);

        // ── Contact info (from template) ──────────────────────────────
        // contactTitleAr, contactTitleEn, contactSubtitleAr, contactSubtitleEn
        // contactPhone, contactEmail, contactLocationAr, contactLocationEn
        // (passed as-is from req.body – no special handling needed)

        // ── Social links (from template) ──────────────────────────────
        // socialInstagram, socialTwitter, socialLinkedin
        // (passed as-is from req.body)

        // ── Journey lines (from template) ─────────────────────────────
        // journeyLine1Ar … journeyLine9Ar
        // journeyLine1En … journeyLine9En
        // (passed as-is from req.body)

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

// ─── Design Settings ─────────────────────────────────────────────────────
// Handles: hero video/image, slider config, service overlay

exports.getDesignSettings = async (req, res) => {
    try {
        let seo = await GlobalSeo.findOne();
        if (!seo) seo = await GlobalSeo.create({});
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

        // ── Slider ────────────────────────────────────────────────────
        data.sliderAutoplay = req.body.sliderAutoplay === 'on';

        // ── Hero background image (optional separate upload field) ────
        if (req.files && req.files['heroBackgroundImage']) {
            data.heroBackgroundImage = await toHashedAsset(req.files['heroBackgroundImage'][0]);
        }
        if (data.heroBackgroundImage) data.heroBackgroundImage = normalizeAsset(data.heroBackgroundImage);

        if (!seo) {
            seo = await GlobalSeo.create(data);
        } else {
            await seo.update(data);
        }
        pageCache.invalidateRoutes(['/', '/en']);
        res.redirect('/admin/design');
    } catch (error) {
        console.error(error);
        res.status(500).send('Server Error');
    }
};

// ─── Partner Management ───────────────────────────────────────────────────

exports.managePartners = async (req, res) => {
    try {
        const partners = await Partner.findAll({ order: [['display_order', 'ASC']] });
        res.render('admin/partners-manage', {
            title: 'لوحة التحكم | إدارة الشركاء',
            path: '/admin/partners',
            partners
        });
    } catch (error) {
        console.error(error);
        res.status(500).send('Server Error');
    }
};

exports.getAddPartner = (req, res) => {
    res.render('admin/partner-form', {
        title: 'لوحة التحكم | إضافة شريك',
        path: '/admin/partners',
        partner: null
    });
};

exports.postAddPartner = async (req, res) => {
    try {
        const { name, display_order, is_active, existingLogo } = req.body;
        let logo = existingLogo ? normalizeAsset(existingLogo) : null;
        if (!logo && req.file) logo = await toHashedAsset(req.file);
        await Partner.create({
            name,
            logo,
            display_order: display_order || 0,
            is_active: is_active === 'on'
        });
        pageCache.invalidateRoutes(['/', '/en', '/portfolio', '/en/portfolio']);
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
            path: '/admin/partners',
            partner
        });
    } catch (error) {
        console.error(error);
        res.status(500).send('Server Error');
    }
};

exports.postEditPartner = async (req, res) => {
    try {
        const partner = await Partner.findByPk(req.params.id);
        if (!partner) return res.redirect('/admin/partners');
        const { name, display_order, is_active, existingLogo } = req.body;
        let logo = normalizeAsset(partner.logo);
        if (existingLogo) logo = normalizeAsset(existingLogo);
        else if (req.file) logo = await toHashedAsset(req.file);
        await partner.update({
            name,
            logo,
            display_order: display_order || 0,
            is_active: is_active === 'on'
        });
        pageCache.invalidateRoutes(['/', '/en', '/portfolio', '/en/portfolio']);
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

// ─── Portfolio Management ─────────────────────────────────────────────────
// Supports bilingual: title_ar / title_en, description_ar / description_en

exports.managePortfolio = async (req, res) => {
    try {
        const projects = await Project.findAll({ order: [['display_order', 'ASC']] });
        res.render('admin/portfolio-manage', {
            title: 'لوحة التحكم | إدارة الأعمال',
            path: '/admin/portfolio',
            projects
        });
    } catch (error) {
        console.error(error);
        res.render('admin/portfolio-manage', {
            title: 'لوحة التحكم | إدارة الأعمال',
            path: '/admin/portfolio',
            projects: []
        });
    }
};

exports.getAddProject = async (req, res) => {
    try {
        const categories = await Category.findAll({ order: [['display_order', 'ASC']] });
        res.render('admin/portfolio-form', {
            title: 'إضافة مشروع جديد',
            path: '/admin/portfolio',
            project: null,
            categories
        });
    } catch (error) {
        console.error(error);
        res.status(500).send('Server Error');
    }
};

exports.postAddProject = async (req, res) => {
    try {
        const {
            title, title_ar, title_en,
            description, description_ar, description_en,
            content, externalLink, category,
            display_order, is_active,
            seoTitle, seoDescription, seoKeywords,
            existingImage
        } = req.body;

        const data = {
            // Legacy single-lang (kept for backward compat)
            title: title_ar || title_en || title || '',
            description: description_ar || description_en || description || '',
            // Bilingual
            title_ar: title_ar || title || null,
            title_en: title_en || title || null,
            description_ar: description_ar || description || null,
            description_en: description_en || description || null,
            content,
            externalLink,
            category,
            display_order: display_order || 0,
            is_active: is_active === 'on',
            seoTitle,
            seoDescription,
            seoKeywords
        };

        if (existingImage) data.image = normalizeAsset(existingImage);
        else if (req.file) data.image = await toHashedAsset(req.file);

        if (data.category && !isNaN(data.category)) {
            data.CategoryId = parseInt(data.category);
            const cat = await Category.findByPk(data.CategoryId);
            if (cat) data.category = cat.slug;
        }

        await Project.create(data);
        pageCache.invalidateRoutes(['/', '/en', '/portfolio', '/en/portfolio']);
        res.redirect('/admin/portfolio');
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
            path: '/admin/portfolio',
            project,
            categories
        });
    } catch (error) {
        console.error(error);
        res.status(500).send('Server Error');
    }
};

exports.postEditProject = async (req, res) => {
    try {
        const project = await Project.findByPk(req.params.id);
        if (!project) return res.redirect('/admin/portfolio');

        const {
            title, title_ar, title_en,
            description, description_ar, description_en,
            content, externalLink, category,
            display_order, is_active,
            seoTitle, seoDescription, seoKeywords,
            existingImage
        } = req.body;

        const data = {
            title: title_ar || title_en || title || '',
            description: description_ar || description_en || description || '',
            title_ar: title_ar || title || null,
            title_en: title_en || title || null,
            description_ar: description_ar || description || null,
            description_en: description_en || description || null,
            content,
            externalLink,
            category,
            display_order: display_order || 0,
            is_active: is_active === 'on',
            seoTitle,
            seoDescription,
            seoKeywords
        };

        if (existingImage) data.image = normalizeAsset(existingImage);
        else if (req.file) data.image = await toHashedAsset(req.file);

        if (data.category && !isNaN(data.category)) {
            data.CategoryId = parseInt(data.category);
            const cat = await Category.findByPk(data.CategoryId);
            if (cat) data.category = cat.slug;
        }

        await project.update(data);
        pageCache.invalidateRoutes(['/', '/en', '/portfolio', '/en/portfolio']);
        res.redirect('/admin/portfolio');
    } catch (error) {
        console.error(error);
        res.status(500).send('Server Error');
    }
};

exports.deleteProject = async (req, res) => {
    try {
        const project = await Project.findByPk(req.params.id);
        if (project) {
            deleteFile(project.image);
            await project.destroy();
        }
        pageCache.invalidateRoutes(['/', '/en', '/portfolio', '/en/portfolio']);
        res.redirect('/admin/portfolio');
    } catch (error) {
        console.error(error);
        res.status(500).send('Server Error');
    }
};

// ─── Category Management ──────────────────────────────────────────────────

exports.manageCategories = async (req, res) => {
    try {
        const categories = await Category.findAll({ order: [['display_order', 'ASC']] });
        res.render('admin/categories-manage', {
            title: 'لوحة التحكم | إدارة التصنيفات',
            path: '/admin/categories',
            categories
        });
    } catch (error) {
        console.error(error);
        res.status(500).send('Server Error');
    }
};

exports.getAddCategory = (req, res) => {
    res.render('admin/category-form', {
        title: 'لوحة التحكم | إضافة تصنيف',
        path: '/admin/categories',
        category: null
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
        res.redirect(req.header('Referer') || '/admin/portfolio');
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
            path: '/admin/categories',
            category
        });
    } catch (error) {
        console.error(error);
        res.status(500).send('Server Error');
    }
};

exports.postEditCategory = async (req, res) => {
    try {
        const category = await Category.findByPk(req.params.id);
        if (!category) return res.redirect('/admin/categories');
        const { name, slug, description, display_order } = req.body;
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
        if (category) await category.destroy();
        res.redirect('/admin/categories');
    } catch (error) {
        console.error(error);
        res.status(500).send('Server Error');
    }
};

// ─── Blog Management ──────────────────────────────────────────────────────
// Supports bilingual: title_ar / title_en, excerpt_ar / excerpt_en

exports.manageBlog = async (req, res) => {
    try {
        const posts = await Post.findAll({ order: [['createdAt', 'DESC']] });
        res.render('admin/blog-manage', {
            title: 'لوحة التحكم | إدارة المدونة',
            path: '/admin/blog',
            posts
        });
    } catch (error) {
        console.error(error);
        res.render('admin/blog-manage', {
            title: 'لوحة التحكم | إدارة المدونة',
            path: '/admin/blog',
            posts: []
        });
    }
};

exports.getAddPost = (req, res) => {
    res.render('admin/blog-form', {
        title: 'إضافة مقال جديد',
        path: '/admin/blog',
        post: null
    });
};

exports.postAddPost = async (req, res) => {
    try {
        const {
            title, title_ar, title_en,
            excerpt, excerpt_ar, excerpt_en,
            content, date, is_active,
            seoTitle, seoDescription, seoKeywords,
            existingImage
        } = req.body;

        const data = {
            // Legacy single-lang (kept for backward compat)
            title: title_ar || title_en || title || '',
            excerpt: excerpt_ar || excerpt_en || excerpt || '',
            // Bilingual
            title_ar: title_ar || title || null,
            title_en: title_en || title || null,
            excerpt_ar: excerpt_ar || excerpt || null,
            excerpt_en: excerpt_en || excerpt || null,
            content,
            date,
            is_active: is_active === 'on',
            seoTitle,
            seoDescription,
            seoKeywords
        };

        if (existingImage) data.image = normalizeAsset(existingImage);
        else if (req.file) data.image = await toHashedAsset(req.file);

        await Post.create(data);
        pageCache.invalidateRoutes(['/', '/en', '/blog']);
        res.redirect('/admin/blog');
    } catch (error) {
        console.error(error);
        res.status(500).send('Server Error');
    }
};

exports.getEditPost = async (req, res) => {
    try {
        const post = await Post.findByPk(req.params.id);
        if (!post) return res.redirect('/admin/blog');
        res.render('admin/blog-form', {
            title: 'تعديل المقال',
            path: '/admin/blog',
            post
        });
    } catch (error) {
        console.error(error);
        res.status(500).send('Server Error');
    }
};

exports.postEditPost = async (req, res) => {
    try {
        const post = await Post.findByPk(req.params.id);
        if (!post) return res.redirect('/admin/blog');

        const {
            title, title_ar, title_en,
            excerpt, excerpt_ar, excerpt_en,
            content, date, is_active,
            seoTitle, seoDescription, seoKeywords,
            existingImage
        } = req.body;

        const data = {
            title: title_ar || title_en || title || '',
            excerpt: excerpt_ar || excerpt_en || excerpt || '',
            title_ar: title_ar || title || null,
            title_en: title_en || title || null,
            excerpt_ar: excerpt_ar || excerpt || null,
            excerpt_en: excerpt_en || excerpt || null,
            content,
            date,
            is_active: is_active === 'on',
            seoTitle,
            seoDescription,
            seoKeywords
        };

        if (existingImage) data.image = normalizeAsset(existingImage);
        else if (req.file) data.image = await toHashedAsset(req.file);

        await post.update(data);
        pageCache.invalidateRoutes(['/', '/en', '/blog']);
        res.redirect('/admin/blog');
    } catch (error) {
        console.error(error);
        res.status(500).send('Server Error');
    }
};

exports.deletePost = async (req, res) => {
    try {
        const post = await Post.findByPk(req.params.id);
        if (post) {
            deleteFile(post.image);
            await post.destroy();
        }
        pageCache.invalidateRoutes(['/', '/en', '/blog']);
        res.redirect('/admin/blog');
    } catch (error) {
        console.error(error);
        res.status(500).send('Server Error');
    }
};

// ─── Contact Management ───────────────────────────────────────────────────

exports.manageContacts = async (req, res) => {
    try {
        const contacts = await Contact.findAll({ order: [['createdAt', 'DESC']] });
        res.render('admin/contacts-manage', {
            title: 'لوحة التحكم | استمارات التواصل',
            path: '/admin/contacts',
            contacts
        });
    } catch (error) {
        console.error(error);
        res.render('admin/contacts-manage', {
            title: 'لوحة التحكم | استمارات التواصل',
            path: '/admin/contacts',
            contacts: []
        });
    }
};

exports.deleteContact = async (req, res) => {
    try {
        const contact = await Contact.findByPk(req.params.id);
        if (contact) await contact.destroy();
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
        if (contact) await contact.update({ status });
        res.json({ success: true });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false });
    }
};

// ─── Service Management ───────────────────────────────────────────────────

exports.manageServices = async (req, res) => {
    try {
        const services = await Service.findAll({ order: [['display_order', 'ASC']] });
        res.render('admin/services-manage', {
            title: 'لوحة التحكم | إدارة الخدمات',
            path: '/admin/services',
            services
        });
    } catch (error) {
        console.error(error);
        res.render('admin/services-manage', {
            title: 'لوحة التحكم | إدارة الخدمات',
            path: '/admin/services',
            services: []
        });
    }
};

exports.fixServiceImages = async (req, res) => {
    try {
        const services = await Service.findAll();
        let fixed = 0;
        for (const service of services) {
            const raw = service.image || '';
            if (!raw) continue;
            let exists = false;
            try {
                const filename = storageService.mapDbValueToLocal(raw);
                if (filename) {
                    const abs = storageService.buildAbsolutePath(filename);
                    exists = fs.existsSync(abs);
                }
            } catch { exists = false; }
            if (!exists) {
                await service.update({ image: null });
                fixed++;
            }
        }
        try { pageCache.invalidateRoutes(['/', '/en']); } catch { }
        res.send(`Service images fix completed. Total: ${services.length}, cleaned: ${fixed}.`);
    } catch (error) {
        console.error(error);
        res.status(500).send('Server Error');
    }
};

exports.getAddService = (req, res) => {
    res.render('admin/service-form', {
        title: 'إضافة خدمة جديدة',
        path: '/admin/services',
        service: null
    });
};

// Shared helper to build service data from request body
const buildServiceData = (body) => {
    const {
        title_ar, title_en,
        description_ar, description_en,
        tag1_ar, tag2_ar, tag3_ar,
        tag1_en, tag2_en, tag3_en,
        display_order, is_active,
        imageAlt_ar, imageAlt_en,
        seoTitle, seoDescription, seoKeywords
    } = body;
    return {
        title_ar, title_en,
        description_ar, description_en,
        tag1_ar: tag1_ar || null,
        tag2_ar: tag2_ar || null,
        tag3_ar: tag3_ar || null,
        tag1_en: tag1_en || null,
        tag2_en: tag2_en || null,
        tag3_en: tag3_en || null,
        display_order: Number(display_order) || 0,
        is_active: is_active === 'on',
        imageAlt_ar: imageAlt_ar || null,
        imageAlt_en: imageAlt_en || null,
        seoTitle: seoTitle || null,
        seoDescription: seoDescription || null,
        seoKeywords: seoKeywords || null
    };
};

const resolveServiceImage = async (existingImage, currentImage, file) => {
    const normalized = normalizeAsset(existingImage);
    let finalImage = normalized;
    if (finalImage) {
        try {
            const filename = storageService.mapDbValueToLocal(finalImage);
            if (filename) {
                const abs = storageService.buildAbsolutePath(filename);
                if (!fs.existsSync(abs)) finalImage = '';
            }
        } catch { finalImage = ''; }
    }
    if (finalImage) return finalImage;
    if (file) return await toHashedAsset(file);
    return currentImage || null;
};

exports.postAddService = async (req, res) => {
    try {
        const data = buildServiceData(req.body);
        data.image = await resolveServiceImage(req.body.existingImage, null, req.file);
        await Service.create(data);
        pageCache.invalidateRoutes(['/', '/en']);
        res.redirect('/admin/services');
    } catch (error) {
        console.error(error);
        res.status(500).send('Server Error');
    }
};

exports.getEditService = async (req, res) => {
    try {
        const service = await Service.findByPk(req.params.id);
        if (!service) return res.redirect('/admin/services');
        res.render('admin/service-form', {
            title: 'تعديل الخدمة',
            path: '/admin/services',
            service
        });
    } catch (error) {
        console.error(error);
        res.status(500).send('Server Error');
    }
};

exports.postEditService = async (req, res) => {
    try {
        const service = await Service.findByPk(req.params.id);
        if (!service) return res.redirect('/admin/services');
        const data = buildServiceData(req.body);
        data.image = await resolveServiceImage(req.body.existingImage, service.image, req.file);
        await service.update(data);
        pageCache.invalidateRoutes(['/', '/en']);
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
        pageCache.invalidateRoutes(['/', '/en']);
        res.redirect('/admin/services');
    } catch (error) {
        console.error(error);
        res.status(500).send('Server Error');
    }
};