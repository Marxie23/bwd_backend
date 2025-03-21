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
const Billing = require("./billingModel");
// Define the Payment model
const Payment = sequelize.define(
    "Payment",
    {
        PaymentID: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
        },
        BillingID: {
            type: DataTypes.INTEGER,
            references: {
                model: Billing, // Reference to Billing model
                key: "BillingID", // Primary key in the referenced model
            },
            allowNull: false,
        },
        PaymentDate: {
            type: DataTypes.DATE,
            allowNull: false,
        },
        Amount: {
            type: DataTypes.FLOAT,
            allowNull: false,
            validate: {
                min: 0, // Ensure amount is non-negative
            },
        },
        PaymentMethod: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        ReferenceNumber: {
            type: DataTypes.STRING,
            allowNull: true,
        },
    },
    {
        tableName: "Payment",
        timestamps: false, // Disable automatic timestamps
    }
);

// Define relationships
Billing.hasMany(Payment, { foreignKey: "BillingID", as: "Payments" });
Payment.belongsTo(Billing, { foreignKey: "BillingID", as: "Billing" });

// Sync model with database
sequelize
    .sync({ force: false })
    .then(() => {
        console.log("Payment model synced with database");
    })
    .catch((err) => {
        console.error("Error syncing Payment model:", err);
    });

module.exports = Payment;
