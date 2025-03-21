const { Sequelize, DataTypes } = require("sequelize");
const sql_config = require("../config/config");

// Initialize Sequelize instance
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
const MeterReading = require("./meterreadingModel");

// Define the Billing model
const Billing = sequelize.define(
    "Billing",
    {
        BillingID: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
        },
        BillingDate: {
            type: DataTypes.DATE,
            allowNull: false,
        },
        DueDate: {
            type: DataTypes.DATE,
            allowNull: false,
        },
        AmountDue: {
            type: DataTypes.FLOAT,
            allowNull: false,
        },
        AmountAfterDue: {
            type: DataTypes.FLOAT,
            allowNull: false,
        },
        AmountPaid: {
            type: DataTypes.FLOAT,
            allowNull: true,
        },
        PaymentStatus: {
            type: DataTypes.STRING,
            defaultValue: "Unpaid",
        },
        ReferenceNumber: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        CustomerID: {
            type: DataTypes.INTEGER,
            references: {
                model: Customer, // The model being referenced
                key: "CustomerID", // Primary key in the referenced model
            },
            allowNull: false,
        },
        MeterReadingID: {
            type: DataTypes.INTEGER,
            references: {
                model: MeterReading, // The model being referenced
                key: "MeterReadingID", // Primary key in the referenced model
            },
            allowNull: false,
        },
    },
    {
        tableName: "Billing",
        timestamps: false, // Disable automatic timestamp fields (createdAt, updatedAt)
    }
);

// Define relationships
Customer.hasMany(Billing, { foreignKey: "CustomerID", as: "Billings" });
Billing.belongsTo(Customer, { foreignKey: "CustomerID", as: "Customer" });
Billing.belongsTo(MeterReading, { foreignKey: "MeterReadingID", as: "MeterReading" })

// Sync model with database
sequelize
    .sync({ force: false })
    .then(() => {
        console.log("Billing model synced with database");
    })
    .catch((err) => {
        console.error("Error syncing Billing model:", err);
    });

module.exports = Billing;
