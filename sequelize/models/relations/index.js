"use strict";

const onTarget = require("./foreignontarget.js");
const onSource = require("./foreignonsource.js");
const throughJunction = require("./foreignthroughjunction.js");

module.exports = (models) =>
  new Promise((resolve) => {

    onTarget(models)
      .then(onSource)
      .then(throughJunction)
      .then((modelsWithRelations) =>
        resolve(modelsWithRelations));

  });
