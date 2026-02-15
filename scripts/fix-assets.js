const path = require('path');
const fs = require('fs');

const rootDir = path.join(__dirname, '..');

try {
    require('dotenv').config({ path: path.join(rootDir, '.env') });
} catch {}

const sequelize = require('../config/database');
const storageService = require('../src/storage/storage.service');

const Service = require('../models/Service');
const Partner = require('../models/Partner');
const Project = require('../models/Project');
const Post = require('../models/Post');
const GlobalSeo = require('../models/GlobalSeo');

async function ensureFileInPersistent(filename) {
    if (!filename) return false;
    const target = storageService.buildAbsolutePath(filename);
    if (fs.existsSync(target)) return true;
    const legacy = path.join(rootDir, 'public', 'uploads', filename);
    if (fs.existsSync(legacy)) {
        const targetDir = path.dirname(target);
        if (!fs.existsSync(targetDir)) {
            fs.mkdirSync(targetDir, { recursive: true });
        }
        fs.copyFileSync(legacy, target);
        return true;
    }
    return false;
}

async function migrateField(instance, field) {
    const current = instance[field];
    if (!current) return { changed: false, missing: false };
    const filename = storageService.mapDbValueToLocal(current);
    if (!filename) return { changed: false, missing: false };
    const ok = await ensureFileInPersistent(filename);
    const newValue = storageService.toDbValue(filename);
    if (newValue && newValue !== current) {
        instance[field] = newValue;
        await instance.save({ fields: [field] });
    }
    return { changed: newValue !== current, missing: !ok };
}

async function run() {
    console.log('[fix:assets] starting');
    await sequelize.authenticate();

    const stats = {
        updated: 0,
        missing: 0
    };

    const processCollection = async (Model, field, label) => {
        const rows = await Model.findAll();
        for (const row of rows) {
            const r = await migrateField(row, field);
            if (r.changed) stats.updated++;
            if (r.missing) {
                stats.missing++;
                console.warn(`[fix:assets] missing file for ${label}#${row.id} field=${field} value=${row[field]}`);
            }
        }
    };

    await processCollection(Service, 'image', 'Service');
    await processCollection(Partner, 'logo', 'Partner');
    await processCollection(Project, 'image', 'Project');
    await processCollection(Post, 'image', 'Post');

    // Global SEO assets
    const seo = await GlobalSeo.findOne();
    if (seo) {
        for (const field of ['favicon', 'ogImage']) {
            const r = await migrateField(seo, field);
            if (r.changed) stats.updated++;
            if (r.missing) stats.missing++;
        }
    }

    console.log('[fix:assets] done', stats);
    await sequelize.close();
}

run().catch((e) => {
    console.error('[fix:assets] error', e);
    process.exitCode = 1;
});

