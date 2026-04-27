const { Op } = require('sequelize');

const toAsciiSlug = (value) => {
    const base = String(value || '')
        .normalize('NFKD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-+|-+$/g, '');
    return base || 'page';
};

const ensureUniqueSlug = async (Model, candidate, excludeId = null) => {
    const base = toAsciiSlug(candidate);
    let slug = base;
    let suffix = 2;
    while (true) {
        const where = { slug };
        if (excludeId) where.id = { [Op.ne]: excludeId };
        const existing = await Model.findOne({ where });
        if (!existing) return slug;
        slug = `${base}-${suffix++}`;
    }
};

module.exports = {
    toAsciiSlug,
    ensureUniqueSlug
};
