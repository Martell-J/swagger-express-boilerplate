"use strict";

const fs = require("fs");
const Promise = require("bluebird");
const path = require("path");

const namespace = require("continuation-local-storage").createNamespace("seq-api-session");
const Sequelize = require("sequelize");
Sequelize.useCLS(namespace);

module.exports = {
  "initializeSequelizeDatabase": (app) => {

    const basename = path.basename(module.filename);

    const {
      ENV,
      DEBUG,
      SEQ_IS_FRESH,
      SEQ_USERNAME,
      SEQ_PASSWORD,
      SEQ_DATABASE,
      SEQ_HOST
    } = process.env;


    // Define the directory for each model definition
    const modelDir = path.join(__dirname, "/definitions");
    let db = {};
    let sequelize = null;

    // Use the environment variable if specified on the compiled config file
    sequelize = new Sequelize(
      SEQ_DATABASE,
      SEQ_USERNAME,
      SEQ_PASSWORD,
      {
        host: SEQ_HOST,
        port: "3306",
        dialect: "mysql",
        logging: ((DEBUG && DEBUG === 'true') || ENV !== "production"),
        encrypt: true,
        operatorsAliases: Sequelize.Op,
        dialectOptions: {
          multipleStatements: true,
          
        }
      }
    );

    const handleShouldSync = (models) =>
      new Promise((resolve) => {

        if (SEQ_IS_FRESH === 'true') {

          const syncProms = [];

          Object.keys(models)
            .sort((aKey, bKey) => models[aKey].syncOrder - models[bKey].syncOrder)
            .forEach((key) => {

              syncProms.push(() => models[key].sync());

            });


          return Promise.each(syncProms, pf => pf(), { concurrency: 1 })
            .then(resolve);

        } else {
  
          return resolve(models);
  
        }

      })

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

          let model = require(path.join(modelDir, file))(sequelize, Sequelize);

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
            .then(handleShouldSync)
            .then((modelsWithRelations) => {

              // Tie in all relations, then append the sequelize connection model/object to the models
              // object
              modelsWithRelations.sequelize = sequelize;
              modelsWithRelations.Sequelize = Sequelize;

              

              app.models = modelsWithRelations.sequelize.models;

              app.logger.info("Sequelize Instance Initialized!");

              return resolve(app);

            });

        })
        .catch((err) => {

          app.logger.error(err);

        });

    });

  },
};
