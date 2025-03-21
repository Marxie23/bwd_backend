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
const Meter = require("./meterModel");

const MeterReading = sequelize.define(
    "MeterReading",
    {
        MeterReadingID: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
        },
        PeriodStart: {
            type: DataTypes.DATE,
            allowNull: true,
        },
        PeriodEnd: {
            type: DataTypes.DATE,
            allowNull: true,
        },
        ReadingDate: {
            type: DataTypes.DATE,
            allowNull: true,
        },
        PresentReading: {
            type: DataTypes.INTEGER,
            allowNull: true,
        },
        PreviousReading: {
            type: DataTypes.INTEGER,
            allowNull: true,
        },
        Consumption: {
            type: DataTypes.INTEGER,
            allowNull: true,
        },
        MeterId: {
            type: DataTypes.INTEGER,
            references: {
                model: Meter, // The model being referenced
                key: "MeterID", // Primary key in the referenced model
            },
            allowNull: true, // Optional: May not always have an associated customer
        },
    },
    {
        tableName: "MeterReading",
        timestamps: false, // Disable automatic timestamp fields (createdAt, updatedAt)
    }
);

// Define relationships
Meter.hasMany(MeterReading, { foreignKey: "MeterId", as: "MeterReading" });
MeterReading.belongsTo(Meter, { foreignKey: "MeterId", as: "Meter" });

sequelize.sync({ force: false })
.then(() => {
  console.log('MeterReading model synced with database');
})
.catch(err => {
  console.error('Error syncing MeterReading model:', err);
});

module.exports = MeterReading;
