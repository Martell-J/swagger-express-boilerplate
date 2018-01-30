/* eslint-disable no-console */
"use strict";

// Put the test for each models and their relational data here...i guess
const localModels = require("../../app").models;

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

        localModels.TESTMODEL.findAll().then((results) => {

          return resolve(_.map(results, (result) => {

            return JSON.parse(JSON.stringify(result.get()));

          }));

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

      return res.send(JSON.stringify({
        "message": "Test failed - Review code",
        "result": err,
      }));

    });

  },

};

// Only export these routes if we're on local
const checkDevDependence = () => {

  const { env, debug } = require("../../app");

  if (env !== "local" && debug === false) {

    // Return points with no codebase.
    Object.keys(endPoints).map((key) => {

      endPoints[key] = (req, res) => res.status(403).send("Unauthorized");

    });

  }

  return endPoints;

};

module.exports = checkDevDependence();
