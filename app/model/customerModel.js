const { Sequelize, DataTypes } = require("sequelize");
const sql_config = require("../config/config");
const sequelize = new Sequelize(sql_config.DATABASE, sql_config.USER, sql_config.PASSWORD, {
    host: sql_config.SERVER,
    dialect: "mssql",
    pool: {
        max: 5,
        min: 0,
        acquire: 30000,
        idle: 10000,
    },
    logging: console.log, // Enable query logging for debugging
    options: {
        encrypt: true,
        trustServerCertificate: true,
    },
});

const Customer = sequelize.define(
    "Customer",
    {
        CustomerID: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
        },
        AccountNum: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        Firstname: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        Middlename: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        Lastname: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        ContactNum: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        Email: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        Address: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        DateCreated: {
            type: DataTypes.DATE,
            allowNull: false,
            defaultValue: DataTypes.NOW,
        },
        Status: {
            type: DataTypes.BOOLEAN, // Changed to BOOLEAN for better handling of active/inactive state
            allowNull: false,
            defaultValue: true, // Default is active
        },
        IsDeleted: {
            type: DataTypes.BOOLEAN, // Changed to BOOLEAN for better handling of active/inactive state
            allowNull: false,
            defaultValue: false, // Default is active
        },
    },
    {
        tableName: "Customer",
        timestamps: false, // Disable automatic timestamp fields (createdAt, updatedAt)
    }
);
sequelize.sync({ force: false })
.then(() => {
  console.log('Customer model synced with database');
})
.catch(err => {
  console.error('Error syncing Customer model:', err);
});

module.exports = Customer;
