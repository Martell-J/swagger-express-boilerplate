"use strict";


const auth = require("http-auth");
const authConnect = require("http-auth-connect");

module.exports = {

  "initializeSwaggerClient": (app) => {

    const { logger } = app;

    const SwaggerExpress = require("swagger-express-mw");
    const swaggerUi = require("swagger-ui-express");

    const { ENV, SWUI_USERNAME, SWUI_PASSWORD } = process.env;

    const authUser = (username, password, callback) => {

      callback(username === SWUI_USERNAME && password === SWUI_PASSWORD);

    };

    // Create the swagger-ui with the given parameters for the API in the resolved config file,
    // and authorize the user before allowing them to access the resource
    const basic = auth.basic({ "realm": "swagger-ui", "skipUser": true }, (username, password, callback) =>
      authUser(username, password, callback));

    basic.on("error", (err, res) => {

      logger.error(err);

      return res.json({
        "message": "Internal error occurred",
        "code": "INTERNAL_ERROR",
      });

    });

    const cors = require("cors");
    const path = require("path");

    return new Promise((resolve) => {

      // Authorize before accessing the basepath, when the path is '/ui' explicitly
      app.use("/ui", authConnect(basic));

      const swaggerConfig = {
        "appRoot": path.join(__dirname, "../"),
        "swaggerFile": path.join(__dirname, "../api"),
        "swagger": app.resolvedSwaggerMU, // Use the parsed JSON refs from earlier
        "swaggerSecurityHandlers": {
          "GlobalSecurity": (req, res, callback) => {

            // Do some security checks here on every-request including the handler...
            // Return the callback with no data when security passes
            return callback();

            // Otherwise, just don't!
            // return callback(new Error("Access Denied!"));

          },
          "Authentication": (req, res, callback) => {

            // Same deal here.
            return callback();

            // We can have multiple handlers to pass per-route


          },
        },
      };

      SwaggerExpress.create(swaggerConfig, (err, swaggerExpress) => {

        if (err) {

          throw err;

        }

        // When debugging, log the path, controller, and operation of each request.
        if (app.debug) {

          app.use("/", (req, res, next) => {

            // Slice off any query parameters from the url
            const url = ~req.url.indexOf("?") ? req.url.slice(0, req.url.indexOf("?")) : req.url;

            // Get the relative path of the route given the url
            const pathSpec = swaggerExpress.runner.getPath(url);

            // If the path exists, log the details of it (Path, Controller, Operation, TimeStamp)
            if (pathSpec) {

              app.logger.info("Request details:\n\t"
                + "Path: " + pathSpec.path + "\n\t"
                + "Controller: " + pathSpec["x-swagger-router-controller"] + "\n\t"
                + "Operation: " + pathSpec.definition[req.method.toLowerCase()].operationId + "\n\t"
                + "TimeStamp: " + new Date().toISOString());

            }

            return next();

          });

        }

        // accept cross origin requests.
        app.use(cors());

        // install middleware
        swaggerExpress.register(app);

        app.logger.info("Swagger Client Created");

        // UI for the API is on /ui
        app.use("/ui", swaggerUi.serve, swaggerUi.setup(app.resolvedSwaggerMU));

        app.use((swmwErr, req, res, next) => {

          if (swmwErr) {

            app.logger.error(swmwErr);

            if (swmwErr.hasOwnProperty("errors")) {

              return res.status(400).json({
                "code": swmwErr.errors[0].code,
                "message": swmwErr.errors[0].message,
              });

              // If the error isn't fitting the errorresponse definition...(This is 99% of the time, a swagger validation error)

            } else if (!swmwErr.hasOwnProperty("code" && !swmwErr.hasOwnProperty("message"))) {

              return res.status(400).json({
                "code": "INTERNAL_ERROR",
                "message": "Internal error occurred, consult an administrator.",
              });

            }

          }

          return next(swmwErr);

        });

        app.logger.info("Swagger UI Client Created");

        resolve(app);

      });

    });

  },

};
