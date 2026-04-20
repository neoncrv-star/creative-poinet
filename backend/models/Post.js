const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Post = sequelize.define('Post', {
    title: {
        type: DataTypes.STRING,
        allowNull: false
    },
    excerpt: {
        type: DataTypes.STRING,
        allowNull: false
    },
    content: {
        type: DataTypes.TEXT,
        allowNull: false
    },
    date: {
        type: DataTypes.DATEONLY,
        defaultValue: DataTypes.NOW
    },
    image: {
        type: DataTypes.STRING,
        allowNull: true
    },
    // SEO Fields
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
    },
    is_active: {
        type: DataTypes.BOOLEAN,
        defaultValue: true
    },
    // Stats
    views: {
        type: DataTypes.INTEGER,
        defaultValue: 0
    }
});

module.exports = Post;
