const { Sequelize, DataTypes } = require('sequelize');
const sql_config = require("../config/config")

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

const Content = sequelize.define('Content', {
    // Define attributes
    ContentID: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
    },
    Title: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
    },
    Description: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    ContentURL: {
        type: DataTypes.STRING,
        allowNull: true,
    }
}, {
    tableName: 'Content', // Optional: specify the table name
    timestamps: true, // Automatically adds createdAt and updatedAt fields
});

sequelize.sync({ force: false })
  .then(() => {
    console.log('Content model synced with database');
  })
  .catch(err => {
    console.error('Error syncing Content model:', err);
  });

module.exports = Content;