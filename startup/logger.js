"use strict";

const winston = require("winston");
winston.emitErrs = true;

module.exports = {
  "initializeLogger": (app) => {

    return new Promise((resolve) => {

      const logger = new winston.Logger({
        "transports": [
          new winston.transports.File({
            "name": "info",
            "level": "info",
            "filename": "./logs/all-logs.log",
            "humanReadableUnhandledException": true,
            "handleExceptions": true,
            "json": true,
            "maxsize": 5242880, // 5MB
            "maxFiles": 5,
            "colorize": false,
          }),
          new winston.transports.File({
            "name": "warn",
            "level": "warn",
            "filename": "./logs/warn-logs.log",
            "humanReadableUnhandledException": true,
            "handleExceptions": true,
            "json": true,
            "maxsize": 5242880, // 5MB
            "maxFiles": 5,
            "colorize": true,
          }),
          new winston.transports.File({
            "name": "error",
            "level": "error",
            "filename": "./logs/error-logs.log",
            "humanReadableUnhandledException": true,
            "handleExceptions": true,
            "json": true,
            "maxsize": 5242880, // 5MB
            "maxFiles": 5,
            "colorize": true,
          }),
          new winston.transports.Console({
            "level": "debug",
            "humanReadableUnhandledException": true,
            "handleExceptions": true,
            "json": false,
            "colorize": true,
          }),
        ],
        "exitOnError": false,
      });

      logger.debug("Overriding \"Express\" logger");

      const stream = {
        "write"(message) {

          logger.info(message);

        },
      };

      app.use(require("morgan")("combined", { stream }));

      app.logger = logger;

      resolve(app);

    });

  },
};
