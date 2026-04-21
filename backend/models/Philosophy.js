const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Philosophy = sequelize.define('Philosophy', {
    mainTitleAr: { type: DataTypes.STRING, defaultValue: 'لم ولن نكن صدفة او حدث عشوائي' },
    mainTitleEn: { type: DataTypes.STRING, defaultValue: 'We were not and will never be a coincidence' },
    mainDescAr: { type: DataTypes.TEXT },
    mainDescEn: { type: DataTypes.TEXT },
    heroImage: { type: DataTypes.STRING }, // الصورة العلوية (الخطوط الحمراء)
    
    // الميزة 1
    pillar1Title: { type: DataTypes.STRING, defaultValue: 'Branding' },
    pillar1DescAr: { type: DataTypes.TEXT },
    pillar1DescEn: { type: DataTypes.TEXT },
    pillar1Icon: { type: DataTypes.STRING },
    
    // الميزة 2
    pillar2Title: { type: DataTypes.STRING, defaultValue: 'Creative Direction' },
    pillar2DescAr: { type: DataTypes.TEXT },
    pillar2DescEn: { type: DataTypes.TEXT },
    pillar2Icon: { type: DataTypes.STRING },
    
    // الميزة 3
    pillar3Title: { type: DataTypes.STRING, defaultValue: 'Photography / Content' },
    pillar3DescAr: { type: DataTypes.TEXT },
    pillar3DescEn: { type: DataTypes.TEXT },
    pillar3Icon: { type: DataTypes.STRING },
    
    // الميزة 4
    pillar4Title: { type: DataTypes.STRING, defaultValue: 'Digital / Campaigns' },
    pillar4DescAr: { type: DataTypes.TEXT },
    pillar4DescEn: { type: DataTypes.TEXT },
    pillar4Icon: { type: DataTypes.STRING }
});

module.exports = Philosophy;