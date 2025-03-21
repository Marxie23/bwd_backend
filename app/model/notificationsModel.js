const { Sequelize, DataTypes } = require('sequelize');
const sql_config = require("../config/config");
const Customer = require('../model/customerModel'); 
const User = require('../model/userModel');

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

// Define Notification Model
const Notification = sequelize.define("Notifications", {
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
  visibleTo: {
    type: DataTypes.ENUM('Admin', 'Cashier', 'User', 'All'),
    allowNull: false,
    defaultValue: 'All', 
  },
  createdAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
  updatedAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
}, {
  tableName: "Notifications",
  timestamps: true,
});

// Many-to-Many Relationship Table for Recipients
const NotificationRecipient = sequelize.define("NotificationRecipient", {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  notificationId: {
    type: DataTypes.INTEGER,
    references: {
      model: Notification,
      key: 'id',
    },
    allowNull: false, // ✅ Ensure notificationId is not unique
    onDelete: 'CASCADE',
  },
  userId: {
    type: DataTypes.INTEGER,
    references: {
      model: User,
      key: 'userID',
    },
    allowNull: true, 
  },
  isRead: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
  },
}, {
  tableName: "NotificationRecipient",
  timestamps: true,
  indexes: [
    {
      unique: false, // ✅ Ensure there is NO uniqueness on notificationId
      fields: ['notificationId'],
    },
  ],
});

// Relationships
NotificationRecipient.belongsTo(Notification, { foreignKey: "notificationId", as: "Notifications" });
Notification.hasMany(NotificationRecipient, { foreignKey: "notificationId", as: "Recipients" });


sequelize
  .sync({ force: false })  // ✅ This ensures database updates without data loss
  .then(() => {
    console.log('Notifications model synced with database');
  })
  .catch(err => {
    console.error('Error syncing Notification model:', err.message);
  });

module.exports = { Notification, NotificationRecipient };
