const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const GlobalSeo = sequelize.define('GlobalSeo', {
    siteTitle: {
        type: DataTypes.STRING,
        defaultValue: 'نقطة إبداعية'
    },
    siteUrl: {
        type: DataTypes.STRING,
        defaultValue: 'https://cpoint-sa.com'
    },
    titleSeparator: {
        type: DataTypes.STRING,
        defaultValue: '|'
    },
    defaultDescription: {
        type: DataTypes.TEXT,
        defaultValue: 'وكالة إبداعية متخصصة في الحلول الرقمية'
    },
    defaultKeywords: {
        type: DataTypes.STRING,
        defaultValue: 'تصميم, برمجة, تسويق'
    },
    homeTitle: {
        type: DataTypes.STRING,
        allowNull: true
    },
    homeDescription: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    homeKeywords: {
        type: DataTypes.STRING,
        allowNull: true
    },
    homeSlug: {
        type: DataTypes.STRING,
        allowNull: true,
        defaultValue: ''
    },
    portfolioTitle: {
        type: DataTypes.STRING,
        allowNull: true
    },
    portfolioDescription: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    portfolioKeywords: {
        type: DataTypes.STRING,
        allowNull: true
    },
    portfolioSlug: {
        type: DataTypes.STRING,
        allowNull: true,
        defaultValue: 'portfolio'
    },
    blogTitle: {
        type: DataTypes.STRING,
        allowNull: true
    },
    blogDescription: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    blogKeywords: {
        type: DataTypes.STRING,
        allowNull: true
    },
    blogSlug: {
        type: DataTypes.STRING,
        allowNull: true,
        defaultValue: 'blog'
    },
    servicesTitle: {
        type: DataTypes.STRING,
        allowNull: true
    },
    servicesDescription: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    servicesKeywords: {
        type: DataTypes.STRING,
        allowNull: true
    },
    servicesSlug: {
        type: DataTypes.STRING,
        allowNull: true,
        defaultValue: 'services'
    },
    philosophyTitle: {
        type: DataTypes.STRING,
        allowNull: true
    },
    philosophyDescription: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    philosophyKeywords: {
        type: DataTypes.STRING,
        allowNull: true
    },
    philosophySlug: {
        type: DataTypes.STRING,
        allowNull: true,
        defaultValue: 'philosophy'
    },
    heroVideoMode: {
        type: DataTypes.STRING,
        defaultValue: 'url'
    },
    heroVideoUrl: {
        type: DataTypes.STRING,
        allowNull: true,
        defaultValue: 'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4'
    },
    heroVideoFile: {
        type: DataTypes.STRING,
        allowNull: true
    },
    // Advanced SEO fields
    favicon: {
        type: DataTypes.STRING,
        allowNull: true
    },
    ogImage: {
        type: DataTypes.STRING,
        allowNull: true
    },
    preloaderImage: {
        type: DataTypes.STRING,
        allowNull: true
    },
    siteLogo: {
        type: DataTypes.STRING,
        allowNull: true
    },
    twitterHandle: {
        type: DataTypes.STRING,
        allowNull: true
    },
    googleAnalyticsId: {
        type: DataTypes.STRING,
        allowNull: true
    },
    facebookPixelId: {
        type: DataTypes.STRING,
        allowNull: true
    },
    customScriptsHeader: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    customScriptsFooter: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    // Structured Data (JSON-LD)
    organizationSchema: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    contactEmail: {
        type: DataTypes.STRING,
        allowNull: true
    },
    contactPhone: {
        type: DataTypes.STRING,
        allowNull: true
    },
    address: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    // Service Section Customization
    serviceOverlayOpacity: {
        type: DataTypes.FLOAT,
        defaultValue: 0.8
    },
    serviceImageBrightness: {
        type: DataTypes.FLOAT,
        defaultValue: 0.5
    },
    // Slider Customization
    sliderEffect: {
        type: DataTypes.STRING,
        defaultValue: 'slide' // slide, fade, cube, coverflow, flip
    },
    sliderHeight: {
        type: DataTypes.STRING,
        defaultValue: '500px'
    },
    sliderAutoplay: {
        type: DataTypes.BOOLEAN,
        defaultValue: true
    },
    sliderAutoplayDelay: {
        type: DataTypes.INTEGER,
        defaultValue: 3000
    },
    sliderSlidesPerView: {
        type: DataTypes.FLOAT,
        defaultValue: 3
    },
    sliderSpaceBetween: {
        type: DataTypes.INTEGER,
        defaultValue: 30
    },
    // Hero Section Customization
    heroSmallTitleAr: {
        type: DataTypes.STRING,
        allowNull: true
    },
    heroSmallTitleEn: {
        type: DataTypes.STRING,
        allowNull: true
    },
    heroMainTitleAr: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    heroMainTitleEn: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    heroDescriptionAr: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    heroDescriptionEn: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    heroBtnTextAr: {
        type: DataTypes.STRING,
        allowNull: true
    },
    heroBtnTextEn: {
        type: DataTypes.STRING,
        allowNull: true
    },
    heroBackgroundImage: {
        type: DataTypes.STRING,
        allowNull: true
    },
    
    // الحقول الجديدة لأكواد التتبع والربط الخارجي
    headerScripts: { 
        type: DataTypes.TEXT,
        allowNull: true
    },
    bodyScripts: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    footerScripts: { 
        type: DataTypes.TEXT,
        allowNull: true
    }
});

module.exports = GlobalSeo;
