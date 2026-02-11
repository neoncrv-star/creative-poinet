const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Project = sequelize.define('Project', {
    title: {
        type: DataTypes.STRING,
        allowNull: false
    },
    description: {
        type: DataTypes.TEXT,
        allowNull: false
    },
    content: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    image: {
        type: DataTypes.STRING,
        allowNull: true
    },
    externalLink: {
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
    // Category and Visibility
    category: {
        type: DataTypes.STRING,
        allowNull: true,
        defaultValue: 'other' // video, websites, identities, other
    },
    CategoryId: {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    is_active: {
        type: DataTypes.BOOLEAN,
        defaultValue: true
    },
    display_order: {
        type: DataTypes.INTEGER,
        defaultValue: 0
    },
    // Stats
    views: {
        type: DataTypes.INTEGER,
        defaultValue: 0
    }
});

// Associations
const Category = require('./Category');
Project.belongsTo(Category);
Category.hasMany(Project);

module.exports = Project;
