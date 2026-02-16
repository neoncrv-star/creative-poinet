const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const StatBlock = sequelize.define('StatBlock', {
    key: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true
    },
    label_ar: {
        type: DataTypes.STRING,
        allowNull: false
    },
    label_en: {
        type: DataTypes.STRING,
        allowNull: false
    },
    value: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0
    },
    suffix_ar: {
        type: DataTypes.STRING,
        allowNull: true
    },
    suffix_en: {
        type: DataTypes.STRING,
        allowNull: true
    },
    display_order: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0
    },
    is_active: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true
    }
});

module.exports = StatBlock;
