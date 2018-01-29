"use strict";

const Axios = require("axios");
const crypto = require("crypto");

module.exports = {

  "initializeSwaggerClient": (app) => {

    const { logger } = app;

    const SwaggerExpress = require("swagger-express-mw");
    const swaggerUi = require("swagger-ui-express");

    const auth = require("http-auth");

    const { secret } = require("config");

    const authUser = (username, password, callback) => {

      callback(username === secret.swagger_ui.username && password === secret.swagger_ui.password);

    };

    const basic = auth.basic({ "realm": "swagger-ui", "skipUser": true }, (username, password, callback) =>
      authUser(username, password, callback));

    basic.on("error", (err, res) => {

      logger.error(err);

      return res.json({
        "message": "Internal error occurred",
        "code": "INTERNAL_ERROR",
      });

    });

    const authRequest = () =>
      auth.connect(basic);

    const cors = require("cors");
    const path = require("path");

    return new Promise((resolve) => {

      // Authorize before accessing the basepath, when the path is '/ui' explicitly
      app.use("/ui", authRequest());

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
            return callback(new Error("Access Denied!"));

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

            const url = ~req.url.indexOf("?") ? req.url.slice(0, req.url.indexOf("?")) : req.url;

            const pathSpec = swaggerExpress.runner.getPath(url);

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

          console.log("No errors yet.")

          return next(swmwErr);

        });

        app.logger.info("Swagger UI Client Created");

        resolve(app);

      });

    });

  },

};
