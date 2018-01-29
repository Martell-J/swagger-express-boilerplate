"use strict";

module.exports = {

  "initializeYAMLRefs": (app) => {

    return new Promise((resolve) => {

      // Pull resolveRefsAt
      const { resolveRefsAt } = require("json-refs");

      const YAML = require("js-yaml");

      // Inject the filter, and safeLoad the yaml, return it as JSON
      // Proceed to load that resulting parsed-def JSON as the swagger MU.

      // Swagger does NOT like relative paths, this is a nice workaround.
      // Sorry swagboy, try again

      // See this magnificent man's solution: https://github.com/apigee-127/swagger-tools/issues/227 @canercandan
      resolveRefsAt("./api/swagger/swagger.yaml", {
        "filter": [ "relative", "remote" ],
        "loaderOptions": {
          "processContent": (res, cb) => cb(null, YAML.safeLoad(res.text)),
        },
      })
        .then((results) => {

          app.resolvedSwaggerMU = results.resolved;

          resolve(app);

        });

    });

  },

};
