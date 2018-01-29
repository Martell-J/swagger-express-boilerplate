"use strict";

const fs = require("fs");
const Promise = require("bluebird");
const path = require("path");

// Tie in CLS-

const namespace = require("continuation-local-storage").createNamespace("seq-api-session");
const Sequelize = require("sequelize");
Sequelize.useCLS(namespace);

module.exports = {
  "initializeSequelizeDatabase": (app) => {

    const basename = path.basename(module.filename);
    const config = require("config");
    const { connection } = config;

    // tie in the Operators object explicitly to each config object
    connection.sequelize.options.operatorsAliases = Sequelize.Op;
    const modelDir = path.join(__dirname, "/definitions");
    let db = {};
    let sequelize = null;

    if (config.use_env_variable) {

      // eslint-disable-next-line no-process-env
      sequelize = new Sequelize(process.env[config.use_env_variable]);

    } else {

      sequelize = new Sequelize(connection.sequelize.database, connection.sequelize.username, connection.sequelize.password, connection.sequelize.options);

    }

    // Custom model definitions for our current setup.
    // This automation will drastically change if DB case changes
    const getModelDefinitions = () => {

      return new Promise((reslv) => {

        const files = fs.readdirSync(modelDir)
          .filter((file) => {

            return file.indexOf(".") !== 0 && file !== basename && file.slice(-3) === ".js";

          });

          if (files.length === 0) {

            return reslv(db);

          }

          files.forEach((file, i, array) => {

            let model = sequelize.import(path.join(modelDir, file));

            const keyName = model.options.keyName;

            // If a keyname is specified, use it
            if (keyName) {

              db[keyName] = model;

            } else {

              // Otherwise, capitalize the first letter of the definition, and use that key
              db[model.name.charAt(0).toUpperCase() + model.name.slice(1)] = model;

            }

            if (i === array.length - 1) {

              Object.keys(db).forEach((modelName, idx, arr) => {

                if (db[modelName].associate) {

                  db[modelName].associate(db);

                }

                if (idx === arr.length - 1) {

                  reslv(db);

                }

              });

            }

          });

      });

    };

    return new Promise((resolve) => {

      return getModelDefinitions()
        .then((models) => {

          if (Object.keys(db).length === 0) {

            app.models = { sequelize, Sequelize };

            app.logger.info("Empty Sequelize Instance Initialized!")

            return resolve(app);

          }

          // Tie the relationships in before processing
          require("./relations/index")(models)
            .then((modelsWithRelations) => {

              modelsWithRelations.sequelize = sequelize;
              modelsWithRelations.Sequelize = Sequelize;

              app.models = modelsWithRelations;

              app.logger.info("Sequelize Instance Initialized!")

              return resolve(app);

            });

        })
        .catch((err) => {

          app.logger.info(err);

        });

    });

  },
};
