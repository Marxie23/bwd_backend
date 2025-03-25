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

const Post = sequelize.define(
  "Post",
  {
    PostID: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    Title: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    Description: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    Category: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    ImageURL: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    DateCreated: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    tableName: "Posts",
    timestamps: false,
  }
);

sequelize
  .sync({ force: false })
  .then(() => {
    console.log("Post model synced with database");
  })
  .catch((err) => {
    console.error("Error syncing Post model:", err);
  });

module.exports = Post;
