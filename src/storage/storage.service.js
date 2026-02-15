const fs = require('fs');
const path = require('path');

const UPLOAD_PATH = process.env.UPLOAD_PATH || path.join(__dirname, '..', '..', 'public', 'uploads');
const UPLOAD_URL = (process.env.UPLOAD_URL || '').replace(/\/+$/, '') || '';

let localHost = null;
let localPrefix = '/uploads/';
if (UPLOAD_URL) {
    try {
        const u = new URL(UPLOAD_URL);
        localHost = u.host.toLowerCase();
        const p = (u.pathname || '/uploads').replace(/\/+$/, '');
        localPrefix = p + (p.endsWith('/') ? '' : '/');
    } catch {
        localHost = null;
        localPrefix = '/uploads/';
    }
}

function ensureUploadDir() {
    try {
        if (!fs.existsSync(UPLOAD_PATH)) {
            fs.mkdirSync(UPLOAD_PATH, { recursive: true });
        }
    } catch (e) {
        console.error('StorageService: failed to ensure upload dir', e);
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

function buildAbsolutePath(filename) {
    const clean = String(filename || '').replace(/^\/+/, '');
    return path.join(UPLOAD_PATH, clean);
}

function mapDbValueToLocal(dbValue) {
    if (!dbValue) return '';
    const v = String(dbValue).trim();
    if (!v) return '';
    if (/^https?:\/\//i.test(v)) {
        if (!UPLOAD_URL) return '';
        try {
            const url = new URL(v);
            if (localHost && url.host.toLowerCase() === localHost && url.pathname.startsWith(localPrefix)) {
                const parts = url.pathname.split('/');
                return parts[parts.length - 1];
            }
            return '';
        } catch {
            return '';
        }
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
        }
    } catch (e) {
        console.error('StorageService: removeFile error', e);
    }
}

module.exports = {
    UPLOAD_PATH,
    UPLOAD_URL,
    ensureUploadDir,
    buildPublicUrl,
    buildAbsolutePath,
    mapDbValueToLocal,
    toDbValue,
    removeFile
};
