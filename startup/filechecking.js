"use strict";
const Promise = require("bluebird");
const fs = Promise.promisifyAll(require("fs"));

module.exports = {

  "initializeFiles": (app) => {

    return new Promise((resolve) => {

      const checkOrCreateFile = (dir, file, data = null) =>

        new Promise((reslv) => {

          // Check if the file doesnt exist
          if (!fs.existsSync(dir)) {

            if (typeof data === "object") {

              data = JSON.stringify(data);

            }

            const createAndWriteFile = () => {

              return new Promise((res) => {

                // Create the directory (will ignore existing directory)
                fs.mkdir(dir, () => {

                  // Write the file (create it)
                  fs.writeFile(dir + "/" + file, data ? data : "", { "flag": "a+" }, (err) => {

                    if (err) {

                      throw new Error(err);

                    }

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
        .then(() => {
          console.info("File-ops complete.");
          return resolve(app);
        });

    });

  },

};
