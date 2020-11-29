/* eslint-disable no-console */
"use strict";

// Put the test for each models and their relational data here...i guess
const localModels = require("../../app").models;

console.log(localModels);

// const { Op } = require("sequelize");
const Promise = require("bluebird");

const endPoints = {

  /*
  "singleORMQuery": (req, res) => {

  },
  */

  "testFunction": (req, res) => {

    let testSample = () => {

      return new Promise((resolve) => {

        localModels.Test.findAll().then((results) => {

          return resolve(results);

        }).catch((err) => {

          console.log(err);
          return resolve(err);

        });

      });

    };

    testSample().then((result) => {

      console.log(result);

      return res.send(JSON.stringify({
        "message": "Test complete",
        result,
      }));

    }).catch((err) => {

      console.error(err);

      return res.send(JSON.stringify({
        "message": "Test failed - Review code",
        "result": err,
      }));

    });

  },

};

// Only export these routes if we're on local
const checkDevDependence = () => {

  const { ENV, DEBUG } = process.env;

  if (ENV !== "local" && DEBUG === false) {

    // Return points with no codebase.
    Object.keys(endPoints).map((key) => {

      endPoints[key] = (req, res) => res.status(403).send("Unauthorized");

    });

  }

  return endPoints;

};

module.exports = checkDevDependence();
