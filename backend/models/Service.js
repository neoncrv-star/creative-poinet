const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Service = sequelize.define('Service', {
    title_ar: {
        type: DataTypes.STRING,
        allowNull: false
    },
    title_en: {
        type: DataTypes.STRING,
        allowNull: false
    },
    description_ar: {
        type: DataTypes.TEXT,
        allowNull: false
    },
    description_en: {
        type: DataTypes.TEXT,
        allowNull: false
    },
    image: {
        type: DataTypes.STRING,
        allowNull: true
    },
    imageAlt_ar: {
        type: DataTypes.STRING,
        allowNull: true
    },
    imageAlt_en: {
        type: DataTypes.STRING,
        allowNull: true
    },
    display_order: {
        type: DataTypes.INTEGER,
        defaultValue: 0
    },
    is_active: {
        type: DataTypes.BOOLEAN,
        defaultValue: true
    },
    // Tags for the service card
    tag1_ar: {
        type: DataTypes.STRING,
        allowNull: true,
        defaultValue: 'استراتيجية'
    },
    tag2_ar: {
        type: DataTypes.STRING,
        allowNull: true,
        defaultValue: 'تصميم'
    },
    tag3_ar: {
        type: DataTypes.STRING,
        allowNull: true,
        defaultValue: 'تنفيذ'
    },
    tag1_en: {
        type: DataTypes.STRING,
        allowNull: true,
        defaultValue: 'Strategy'
    },
    tag2_en: {
        type: DataTypes.STRING,
        allowNull: true,
        defaultValue: 'Design'
    },
    tag3_en: {
        type: DataTypes.STRING,
        allowNull: true,
        defaultValue: 'Execution'
    },
    // SEO Fields
    slug: {
        type: DataTypes.STRING,
        allowNull: true
    },
    bullet_points_ar: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    bullet_points_en: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    gallery_images: {
        type: DataTypes.TEXT,
        allowNull: true,
        get() {
            const raw = this.getDataValue('gallery_images');
            if (!raw) return [];
            try { return JSON.parse(raw); } catch { return []; }
        },
        set(val) {
            if (Array.isArray(val)) {
                this.setDataValue('gallery_images', JSON.stringify(val));
            } else {
                this.setDataValue('gallery_images', val);
            }
        }
    },
    seoTitle: {
        type: DataTypes.STRING,
        allowNull: true
    },
    seoDescription: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    seoKeywords: {
        type: DataTypes.STRING,
        allowNull: true
    }
});

module.exports = Service;
