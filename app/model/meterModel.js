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
    options: {
        encrypt: true,
        trustServerCertificate: true,
    },
});

// Import the Customer model to define relationships
const Customer = require("./customerModel");

const Meter = sequelize.define(
    "Meter",
    {
        MeterID: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
        },
        MeterNumber: {
            type: DataTypes.STRING,
            allowNull: false,
            unique: true, // Optional: Ensure no duplicate meter numbers
        },
        InstallationDate: {
            type: DataTypes.DATE,
            allowNull: true,
        },
        Status: {
            type: DataTypes.BOOLEAN, // Changed to BOOLEAN for better state representation
            allowNull: false,
            defaultValue: true, // Default is active
        },
        CustomerId: {
            type: DataTypes.INTEGER,
            references: {
                model: Customer, // The model being referenced
                key: "CustomerID", // Primary key in the referenced model
            },
            allowNull: true, // Optional: May not always have an associated customer
        },
    },
    {
        tableName: "Meter",
        timestamps: false, // Disable automatic timestamp fields (createdAt, updatedAt)
    }
);

// Define relationships
Customer.hasMany(Meter, { foreignKey: "CustomerId", as: "Meters" });
Meter.belongsTo(Customer, { foreignKey: "CustomerId", as: "Customer" });

sequelize.sync({ force: false })
.then(() => {
  console.log('Meter model synced with database');
})
.catch(err => {
  console.error('Error syncing Meter model:', err);
});

module.exports = Meter;
