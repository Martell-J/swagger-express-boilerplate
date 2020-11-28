"use strict";

const path = require("path");
const fs = require("fs");
const mkdirp = require("mkdirp");
const getDirName = require("path").dirname;

const configDir = path.join(__dirname, "../config");

let config = {};

const getEnvs = () =>
  new Promise((resolve) => {

    fs.readdirSync(configDir)
      .forEach((file, i, array) => {

        let json = require(path.join(configDir, file)).connection.sequelize;

        json = { ...json, ...json.options };

        delete json.options;

        config[file.split(".json")[0]] = json;

        if (i === array.length - 1) {

          resolve();

        }

      });

  });

getEnvs()
  .then(() => {

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

  });
