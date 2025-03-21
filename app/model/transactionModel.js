const { Sequelize, DataTypes } = require('sequelize');
const sql_config = require("../config/config");
const Customer = require("./customerModel");
const User = require("./userModel");

const sequelize = new Sequelize(sql_config.DATABASE, sql_config.USER, sql_config.PASSWORD, {
    host: sql_config.SERVER,
    dialect: 'mssql',
    pool: {
        max: 5,
        min: 0,
        acquire: 30000,
        idle: 10000
    },
    dialectOptions: {
        encrypt: true,
        trustServerCertificate: true
    }
});

const Transaction = sequelize.define("Transaction", {
    TransactionID: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    CustomerId: {
        type: DataTypes.INTEGER,
        references: {
            model: Customer,
            key: "CustomerID"
        },
        allowNull: true, // Some transactions may not be linked to a customer
    },
    UserId: {
        type: DataTypes.INTEGER,
        references: {
            model: User,
            key: "UserID"
        },
        allowNull: false // Ensure a staff/cashier is always recorded
    },
    TotalAmount: {
        type: DataTypes.FLOAT,
        allowNull: false
    },
    PaymentMethod: {
        type: DataTypes.STRING,
        allowNull: false
    },
    Status: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: "Pending"
    },
    TransactionDate: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW
    }
}, {
    tableName: "Transaction",
    timestamps: true, // Enables `createdAt` & `updatedAt`
    paranoid: true,  // Enables `deletedAt` for soft deletes
});

// **Define Relationships**
Customer.hasMany(Transaction, { foreignKey: "CustomerId", as: "Transactions" });
Transaction.belongsTo(Customer, { foreignKey: "CustomerId", as: "Customer" });

User.hasMany(Transaction, { foreignKey: "UserId", as: "Transactions" });
Transaction.belongsTo(User, { foreignKey: "UserId", as: "User" });

// **Sync with Database**
sequelize.sync({ force: false })
    .then(() => console.log('Transaction model synced with database'))
    .catch(err => console.error('Error syncing Transaction model:', err));

module.exports = Transaction;
