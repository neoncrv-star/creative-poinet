const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const GlobalSeo = sequelize.define('GlobalSeo', {
    siteTitle: {
        type: DataTypes.STRING,
        defaultValue: 'نقطة إبداعية'
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
    }
});

module.exports = GlobalSeo;
