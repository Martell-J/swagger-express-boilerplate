"use strict";
const Promise = require("bluebird");
const fs = Promise.promisifyAll(require("fs"));

module.exports = {

  "initializeFiles": (app) => {

    return new Promise((resolve) => {

      const checkOrCreateFile = (dir, file, data = null) =>

        new Promise((reslv) => {

          if (!fs.existsSync(dir)) {

            if (typeof data === "object") {

              data = JSON.stringify(data);

            }

            const createAndWriteFile = () => {

              return new Promise((res) => {

                fs.mkdir(dir, () => {

                  fs.writeFile(dir + "/" + file, data ? data : "", { "flag": "a+" }, (err) => {

                    if (err) {

                      throw new Error(err);

                    }

                    // TODO: same

                    return res();

                  });

                });

              });

            };

            return reslv(createAndWriteFile());

          }

          return reslv();


        });

      return checkOrCreateFile("./logs", "all-logs.log")
        .then(() => resolve(app));

    });

  },

};
