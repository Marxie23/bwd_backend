const { Sequelize, DataTypes } = require('sequelize');
const sql_config = require("../config/config");
const Customer = require('../model/customerModel'); // Import the Customer model
const User = require('../model/userModel'); // Import the User model

const sequelize = new Sequelize(sql_config.DATABASE, sql_config.USER, sql_config.PASSWORD, {
  host: sql_config.SERVER,
  dialect: 'mssql',
  pool: {
    max: 5,
    min: 0,
    acquire: 30000,
    idle: 10000,
  },
  dialectOptions: {
    encrypt: true,
    trustServerCertificate: true,
  },
});

const Notification = sequelize.define(
  "Notification",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    type: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    content: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    contentId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    to: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    isRead: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    isRemoved: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    customerId: {
      type: DataTypes.INTEGER,
      references: {
        model: Customer,
        key: 'CustomerID',
      },
      allowNull: true, // Optional if the notification is not always linked to a customer
    },
    userId: {
      type: DataTypes.INTEGER,
      references: {
        model: User,
        key: 'userID',
      },
      allowNull: true, // Optional if the notification is not always linked to a user
    },
    createdAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
    updatedAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    tableName: "Notification",
    timestamps: true,
  }
);

// Relationships
Customer.hasMany(Notification, { foreignKey: "customerId", as: "Notifications" });
Notification.belongsTo(Customer, { foreignKey: "customerId", as: "Customer" });

User.hasMany(Notification, { foreignKey: "userId", as: "UserNotifications" });
Notification.belongsTo(User, { foreignKey: "userId", as: "User" });

sequelize
  .sync({ force: false })
  .then(() => {
    console.log('Notification model synced with database');
  })
  .catch(err => {
    console.error('Error syncing Notification model:', err.message);
  });

module.exports = Notification;
