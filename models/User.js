const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const bcrypt = require('bcryptjs');

const User = sequelize.define('User', {
    username: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true
    },
    password: {
        type: DataTypes.STRING,
        allowNull: false
    },
    role: {
        type: DataTypes.STRING,
        defaultValue: 'admin' // super_admin, admin
    }
});

// Method to check password
User.prototype.validPassword = async function(password) {
    return await bcrypt.compare(password, this.password);
};

// Hash password before saving
const hashPassword = async (user) => {
    if (user.changed('password')) {
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(user.password, salt);
    }
};

User.beforeCreate(hashPassword);
User.beforeUpdate(hashPassword);

module.exports = User;
