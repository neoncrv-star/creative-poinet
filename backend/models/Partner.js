const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Partner = sequelize.define('Partner', {
    name: {
        type: DataTypes.STRING,
        allowNull: false
    },
    logo: {
        type: DataTypes.STRING,
        allowNull: false
    },
    display_order: {
        type: DataTypes.INTEGER,
        defaultValue: 0
    },
    is_active: {
        type: DataTypes.BOOLEAN,
        defaultValue: true
    }
});

module.exports = Partner;
