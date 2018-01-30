# Purpose

The purpose of this repository is to provide a common starting-place for a typical
api, with a few neat development caveats.

This boilerplate is setup to accept cross-origin requests, utilizing swagger.io,
and express.

This api features:
  1. An organizable swagger-markup .yaml file structure (For ease of development)
  2. An organized sequelize Model/Migration/Seed/Config/Relationship file structure
  3. Differentiated debug mode boilerplate, to log basic parameters of a route for
     ease in manual route testing
  4. A script to auto-generate the dynamically-interpreted config file to workaround
     sequelize-cli's incompability in reading dynamic config files on runtime.
  5. A handler/module based runtime for the server, allowing you to asynchronously
     load prerequisites for your configuration
  6. A UI to manually query api routes without accessing the server from a cross-origin
     location
  7. Swagger Validation to enforce meeting parameter-structure on request.

# Startup

After pulling a copy of the repository

'npm install' - Garner dependencies

'node ./scripts/init-cli-config.js' From Project Root - Runs the sequelize-init script via node

'npm run local-generic' OR 'npm run local-debug' - Runs local database-configuration, in generic or debug mode

# Sequelize-CLI

'npm run sequelize --env=local-debug' - will run CLI commands with the specified configuration based on 'env' flag
