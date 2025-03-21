const { Sequelize, DataTypes } = require('sequelize');
const sql_config = require("../config/config")
const Position = require("../model/positionModel");
const Customer = require('./customerModel');

const sequelize = new Sequelize(sql_config.DATABASE, sql_config.USER, sql_config.PASSWORD, {
  host: sql_config.SERVER,
  dialect: 'mssql',
  pool:{
    max: 5,
    min: 0,
    acquire: 30000,
    idle: 10000
  },
  options: {
      encrypt: true,
      trustServerCertificate: true
  }
});

const User = sequelize.define("User", {
    UserID: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    Username:{
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
    },
    Lastname:{
      type: DataTypes.STRING,
      allowNull: true,
    },
    Firstname:{
    type: DataTypes.STRING,
    allowNull: true,
    },
    Middlename:{
    type: DataTypes.STRING,
    allowNull: true,
    },
    Position:{
    type: DataTypes.STRING,
    allowNull: true,
    },
    Email:{
        type: DataTypes.STRING,
        allowNull: true,
    },
    Password:{
        type: DataTypes.STRING,
        allowNull: false,
    },
    AccessType:{
        type: DataTypes.STRING,
        allowNull: true,
    },
    Picture_path:{
      type: DataTypes.STRING,
      allowNull: true,
    },
    IsActive:{
      type: DataTypes.BOOLEAN,
      allowNull: true,
      defaultValue: false
    },
    PositionId: {
      type: DataTypes.INTEGER,
      references: {
          model: Position,
          key: "PositionID",
      },
      allowNull: true,
    },
    CustomerId:{
      type: DataTypes.INTEGER,
      references: {
        model: Customer, // The model being referenced
        key: "CustomerID"
      },
      allowNull: true, // Optional: May not always have an associated customer
    },
    createdAt: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
    }
  },{
      tableName:"User",
      timestamps: true,
  }
);
Customer.hasMany(User,{ foreignKey:"CustomerId", as :"Customer" });
User.belongsTo(Customer,{ foreignKey:"CustomerId", as :"Customer" })
  sequelize.sync({ force: false })
    .then(() => {
      console.log('User model synced with database');
    })
    .catch(err => {
      console.error('Error syncing User model:', err);
    });
    User.belongsTo(Position, { foreignKey: 'PositionId', as: 'Pos' });
  module.exports = User;
