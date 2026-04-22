const fs = require('fs');
const path = require('path');

// تحديد مسار المجلد الأساسي للمشروع (للتحقق الأمني)
const projectRoot = path.resolve(__dirname, '..', '..', '..');

const UPLOAD_PATH = process.env.UPLOAD_PATH || path.join(projectRoot, 'frontend', 'public', 'uploads');
const RAW_UPLOAD_URL = (process.env.UPLOAD_URL || '').trim();

// 🛡️ حارس الإقلاع الصارم (Startup Guard - Anti Data Loss)
const isProd = (process.env.NODE_ENV || '').toLowerCase() === 'production';
const resolvedUploadPath = path.resolve(UPLOAD_PATH);

if (isProd) {
    // إذا كان مسار الصور يقع داخل مجلد المشروع في بيئة الإنتاج، ارفض التشغيل!
    if (resolvedUploadPath.startsWith(projectRoot)) {
        throw new Error(
            `\n🚨 CRITICAL CONFIGURATION ERROR (Anti-Data-Loss Guard) 🚨\n` +
            `To prevent deleting user images during Git/Deployment updates, ` +
            `UPLOAD_PATH must be OUTSIDE the project directory.\n\n` +
            `[Current Path]: ${resolvedUploadPath}\n` +
            `[Project Root]: ${projectRoot}\n\n` +
            `👉 FIX: Add UPLOAD_PATH=/home/u494530316/uploads to your server's .env file.\n`
        );
    }
}

let UPLOAD_URL = '';
let localHost = null;
let localPrefix = '/uploads/';
if (RAW_UPLOAD_URL) {
    try {
        const u = new URL(RAW_UPLOAD_URL);
        UPLOAD_URL = (u.origin + (u.pathname || '')).replace(/\/+$/, '');
        localHost = u.host.toLowerCase();
        const p = (u.pathname || '/uploads').replace(/\/+$/, '');
        localPrefix = p + (p.endsWith('/') ? '' : '/');
    } catch {
        localHost = null;
        localPrefix = '/uploads/';
        UPLOAD_URL = '';
    }
}

function ensureUploadDir() {
    try {
        if (!fs.existsSync(resolvedUploadPath)) {
            fs.mkdirSync(resolvedUploadPath, { recursive: true });
            console.log(`✅ StorageService: Created upload directory at ${resolvedUploadPath}`);
        }
    } catch (e) {
        console.error(`❌ StorageService: Failed to ensure upload dir at ${resolvedUploadPath}`, e.message);
    }
}

ensureUploadDir();

function buildPublicUrl(filename) {
    const clean = String(filename || '').replace(/^\/+/, '');
    if (!clean) return '';
    if (UPLOAD_URL) {
        return `${UPLOAD_URL}/${clean}`;
    }
    return `/uploads/${clean}`;
}

// 🛡️ بناء المسار المطلق مع الحماية من Path Traversal
function buildAbsolutePath(filename) {
    const clean = String(filename || '').replace(/^\/+/, '');
    if (!clean) return resolvedUploadPath;

    // دمج المسار
    const targetPath = path.resolve(resolvedUploadPath, clean);

    // فحص أمني: التأكد من أن الملف المطلوب لا يقع خارج مجلد الصور (مثال: ../../../etc/passwd)
    if (!targetPath.startsWith(resolvedUploadPath)) {
        console.warn(`⚠️ SECURITY WARNING: Path traversal attempt blocked for file: ${filename}`);
        throw new Error('Invalid file path');
    }

    return targetPath;
}

// 🩺 دالة جديدة للتحقق من وجود الملف (تُستخدم في الـ Health Check والـ Migration)
function fileExists(filename) {
    if (!filename) return false;
    try {
        const abs = buildAbsolutePath(filename);
        return fs.existsSync(abs);
    } catch (e) {
        return false;
    }
}

function mapDbValueToLocal(dbValue) {
    if (!dbValue) return '';
    const v = String(dbValue).trim();
    if (!v) return '';
    try {
        if (/^https?:\/\//i.test(v)) {
            const url = new URL(v);
            const pathname = url.pathname || '';
            const idxPath = pathname.lastIndexOf('/uploads/');
            if (idxPath !== -1) {
                return pathname.substring(idxPath + '/uploads/'.length).replace(/^\/+/, '');
            }
            if (localHost && url.host.toLowerCase() === localHost && pathname.startsWith(localPrefix)) {
                const parts = pathname.split('/');
                return parts[parts.length - 1];
            }
        }
    } catch {
    }
    const idx = v.lastIndexOf('/uploads/');
    if (idx !== -1) {
        return v.substring(idx + '/uploads/'.length);
    }
    return v.replace(/^\/+/, '');
}

function toDbValue(filename) {
    const clean = String(filename || '').replace(/^\/+/, '');
    if (!clean) return '';
    return buildPublicUrl(clean);
}

function removeFile(filename) {
    try {
        const abs = buildAbsolutePath(filename);
        if (fs.existsSync(abs)) {
            fs.unlinkSync(abs);
            console.log(`🗑️ StorageService: Removed file ${filename}`);
        }
    } catch (e) {
        console.error(`❌ StorageService: removeFile error for ${filename}`, e.message);
    }
}

module.exports = {
    UPLOAD_PATH: resolvedUploadPath,
    UPLOAD_URL,
    ensureUploadDir,
    buildPublicUrl,
    buildAbsolutePath,
    fileExists, // تم تصدير الدالة الجديدة
    mapDbValueToLocal,
    toDbValue,
    removeFile
};