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
    portfolioTitle: {
        type: DataTypes.STRING,
        allowNull: true
    },
    portfolioDescription: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    blogTitle: {
        type: DataTypes.STRING,
        allowNull: true
    },
    blogDescription: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    heroVideoUrl: {
        type: DataTypes.STRING,
        allowNull: true,
        defaultValue: 'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4'
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
    }
});

module.exports = GlobalSeo;
