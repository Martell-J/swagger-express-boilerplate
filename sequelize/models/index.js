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

    // Define the directory for each model definition
    const modelDir = path.join(__dirname, "/definitions");
    let db = {};
    let sequelize = null;

    // Use the environment variable if specified on the compiled config file
    if (config.use_env_variable) {

      // eslint-disable-next-line no-process-env
      sequelize = new Sequelize(process.env[config.use_env_variable]);

    } else {

      sequelize = new Sequelize(connection.sequelize.database, connection.sequelize.username, connection.sequelize.password, connection.sequelize.options);

    }

    // Custom model definitions for our current setup.
    const getModelDefinitions = () => {

      return new Promise((reslv) => {

        // Go through each definition
        const files = fs.readdirSync(modelDir)
          .filter((file) => {

            // Find files not named index, of type javascript
            return file.indexOf(".") !== 0 && file !== basename && file.slice(-3) === ".js";

          });

        // If we don't have any files, none are defined.
        if (files.length === 0) {

          return reslv(db);

        }

        // Import the file by joining the model directory and the filename into Sequelize
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

          // If we're at the end of the array...
          if (i === array.length - 1) {

            // go through every object
            Object.keys(db).forEach((modelName, idx, arr) => {

              // Check if there's an associate attribute tied to the sequelize model, if so.
              // execute it and pass all models. (Should auto-associate the correct models)
              if (db[modelName].associate) {

                db[modelName].associate(db);

              }

              // if we're at the end of the array, end the process
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

          // If we have all of the models, just tie in the connection model, and the assets object
          if (Object.keys(db).length === 0) {

            app.models = { sequelize, Sequelize };

            app.logger.info("Empty Sequelize Instance Initialized!");

            return resolve(app);

          }

          // Tie the relationships in before processing
          require("./relations/index")(models)
            .then((modelsWithRelations) => {

              // Tie in all relations, then append the sequelize connection model/object to the models
              // object
              modelsWithRelations.sequelize = sequelize;
              modelsWithRelations.Sequelize = Sequelize;

              app.models = modelsWithRelations;

              app.logger.info("Sequelize Instance Initialized!");

              return resolve(app);

            });

        })
        .catch((err) => {

          app.logger.info(err);

        });

    });

  },
};
