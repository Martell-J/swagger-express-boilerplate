"use strict";

/* Generates a config file for the cli.  See: https://sequelize.org/master/manual/migrations.html */

require('dotenv').config();

const fs = require("fs");
const mkdirp = require("mkdirp");
const getDirName = require("path").dirname;

const { SEQ_USERNAME,
  SEQ_PASSWORD,
  SEQ_DATABASE,
  SEQ_HOST,
  ENV } = process.env;


let config = {
  [ENV]: {
    "username": SEQ_USERNAME,
    "password": SEQ_PASSWORD,
    "database": SEQ_DATABASE,
    "options": {
      "host": SEQ_HOST,
      "port": "3306",
      "dialect": "mysql",
      "logging": false,
      "dialectOptions": {
        "multipleStatements": true,
        "encrypt": true
      }
    }
  }
};


mkdirp(getDirName("./sequelize/config/config.json"), (err) => {

  if (err) {

    console.log(err);

  }

  fs.writeFile("./sequelize/config/config.json", JSON.stringify(config), (err) => {

    if (err) {
      console.log(err)
    }

  });

});