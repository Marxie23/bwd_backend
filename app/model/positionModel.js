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

const Position = sequelize.define('Position', {
    // Define attributes
    PositionID: {
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
        type: DataTypes.TEXT,
        allowNull: true,
    }
}, {
    tableName: 'Position', // Optional: specify the table name
    timestamps: true, // Automatically adds createdAt and updatedAt fields
});

sequelize.sync({ force: false })
  .then(() => {
    console.log('Position model synced with database');
  })
  .catch(err => {
    console.error('Error syncing Position model:', err);
  });

module.exports = Position;