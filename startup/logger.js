"use strict";

const winston = require("winston");
const { format } = winston;

module.exports = {
  "initializeLogger": (app) => {

    return new Promise((resolve) => {

      const consoleFormatter = format.printf(info => {
        return `${info.timestamp} ${info.label} ${info.level}: ${info.message}`;
      });

      const logger = new winston.createLogger({
        "level": "info",
        "format": format.combine(
          format.json(),
          format.colorize(),
          format.label({ label: '[app-server]' }),
          format.timestamp(),
          format.splat(),
          consoleFormatter
        ),
        "defaultMeta": {"app": "swagger-express-boilerplate"},
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
            "level": "debug"
          }),
        ],
        "exitOnError": false,
      });

      console.log("Initializing logger");

      logger.debug(`Overriding "Express" logger`);

      const stream = {
        "write"(message) {

          logger.info(message);

        },
      };

      app.use(require("morgan")("combined", { stream }));

      app.logger = logger;
      
      logger.debug("Logger initialized.");
      return resolve(app);

    });

  },
};
