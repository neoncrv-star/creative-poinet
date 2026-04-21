const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Service = sequelize.define('Service', {
    title_ar: { type: DataTypes.STRING, allowNull: false },
    title_en: { type: DataTypes.STRING, allowNull: false },
    description_ar: { type: DataTypes.TEXT, allowNull: false },
    description_en: { type: DataTypes.TEXT, allowNull: false },
    
    // --- الحقول الجديدة ---
    bullet_points_ar: { 
        type: DataTypes.TEXT, 
        allowNull: true,
        comment: 'نقاط تفصيلية مفصولة بسطر جديد'
    },
    bullet_points_en: { 
        type: DataTypes.TEXT, 
        allowNull: true 
    },
    gallery_images: { 
        type: DataTypes.TEXT, 
        allowNull: true,
        comment: 'مصفوفة صور المعرض بصيغة JSON',
        get() {
            const rawValue = this.getDataValue('gallery_images');
            return rawValue ? JSON.parse(rawValue) : [];
        },
        set(value) {
            this.setDataValue('gallery_images', JSON.stringify(value || []));
        }
    },
    // ---------------------

    image: { type: DataTypes.STRING, allowNull: true },
    imageAlt_ar: { type: DataTypes.STRING, allowNull: true },
    imageAlt_en: { type: DataTypes.STRING, allowNull: true },
    display_order: { type: DataTypes.INTEGER, defaultValue: 0 },
    is_active: { type: DataTypes.BOOLEAN, defaultValue: true },
    
    tag1_ar: { type: DataTypes.STRING, allowNull: true, defaultValue: 'استراتيجية' },
    tag2_ar: { type: DataTypes.STRING, allowNull: true, defaultValue: 'تصميم' },
    tag3_ar: { type: DataTypes.STRING, allowNull: true, defaultValue: 'تنفيذ' },
    tag1_en: { type: DataTypes.STRING, allowNull: true, defaultValue: 'Strategy' },
    tag2_en: { type: DataTypes.STRING, allowNull: true, defaultValue: 'Design' },
    tag3_en: { type: DataTypes.STRING, allowNull: true, defaultValue: 'Execution' },
    
    seoTitle: { type: DataTypes.STRING, allowNull: true },
    seoDescription: { type: DataTypes.TEXT, allowNull: true },
    seoKeywords: { type: DataTypes.STRING, allowNull: true }
});

module.exports = Service;