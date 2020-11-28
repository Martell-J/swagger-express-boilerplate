"use strict";

const app = require("express")();

const { connection, env, debug } = require("config");

const helmet = require("helmet");

// Handler for initializing a logger and tying it to app
const { initializeLogger } = require("./startup/logger");

// Handlers for:
//  File Checking: Ensures that mandatory handler-based files exist. Creates them if they do not.
const { initializeFiles } = require("./startup/filechecking.js");

// Handler for initializing the swagger-client with a specified markup/config
const { initializeSwaggerClient } = require("./startup/swaggerclient.js");

// Handler for compiling multiple yaml files into a large JSON swagger markup,
// to be passed to initializeSwaggerClient
const { initializeYAMLRefs } = require("./startup/yamlrefs.js");

// Initializes the database and builds the relative models/relationships
const { initializeSequelizeDatabase } = require("./sequelize/models/index.js");

// Set a flag stating that the app is not ready
app.isReady = false;

// Setup the Environment var for future reference in handlers
app.env = env;

app.debug = debug;

process.on("unhandledRejection", (err) => {

  console.log(err)

  // Actually throw stack-traces for unhandled rejections (mainly for promise debugging)
  throw err;

});

const Promise = require("bluebird");

// Ties in custom pre-server operational middleware.

// 1. If the app is not ready, respond with a 403 to every request
const initializePreServerOps = () => {

  return new Promise((resolve) => {

    // See: https://expressjs.com/en/advanced/best-practice-security.html
    // For potential future measures

    // Includes:
    // 1. dnsPrefetchControl
    // 2. frameguard - No Clickjacking
    // 3. Removes "Powered By:" header (NA)
    // 4. hsts - HTTP Strict transport security
    // 5. ieNoOpen - sets X-Download-Options for IE8+
    // 6. noSniff - keep clients from sniffing the MIME type
    // 7. xssFilter - some small XSS protections

    // More information can be found on the npm site.
    // See: https://www.npmjs.com/package/helmet
    app.use(helmet());

    // Until the isReady flag (tied to app) is set to true, deny ALL request attempts
    app.use((req, res, next) => {

      if (app.isReady) {

        return next();

      }

      return res.status(403).end("Forbidden");

    });

    console.info("Pre-server ops complete.");

    resolve(app);

  });

};

// References the current port, and fires app.listen on it. (Defaults to 10010)
const initializeServerStart = () => {

  return new Promise((resolve) => {

    // eslint-disable-next-line no-process-env
    const port = process.env.PORT || 10010;

    app.listen(port, () => {

      app.logger.info("API Server running on port " + port);

    });

    return resolve(app);

  });

};

// 1. Use errorhandler middleware
const initializeMiscellaneous = () => {

  return new Promise((resolve) => {

    app.use((err, req, res, next) => {

      return errorHandler(err, req, res, next);

    });

    module.exports = app;

    return resolve(app);

  });

};

initializePreServerOps(app)
  .then(initializeFiles)
  .then(initializeLogger)
  .then(initializeSequelizeDatabase)
  .then(initializeYAMLRefs)
  .then(initializeServerStart)
  .then(initializeMiscellaneous)
  .then(initializeSwaggerClient)
  .then(() => {

    app.isReady = true;

  })
  .catch((err) => {

    if (app.logger) {

      app.logger.error(err);

    }

  });
