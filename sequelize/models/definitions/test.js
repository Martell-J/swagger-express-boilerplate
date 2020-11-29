"use strict";

module.exports = (sequelize, dataTypes) => {

  const Test = sequelize.define("Test", {
    "test_id": {
      "type": dataTypes.INTEGER,
      "primaryKey": true,
      "autoIncrement": true,
    },
    "first_name": {
      "type": dataTypes.STRING,
      "allowNull": false,
    },
    "last_name": {
      "type": dataTypes.STRING,
      "allowNull": false,
    }
  }, {

    // Define the keyname generated via models index.js
    "keyName": "Test",

    "syncOrder": 1,

    // Table paramters
    "tableName": "tbl_test",
    "freezeTableName": true,

    // No timestamps
    "timestamps": false,

  });

  return Test;

};