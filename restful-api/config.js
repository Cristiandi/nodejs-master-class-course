/*
* create n export configuration vars
*/

// container for all environments

const environments = {};

// staging (default) object
environments.staging = {
    port: 3000,
    envName: 'staging'
};

// production object
environments.production = {
    port: 3001,
    envName: 'production'
};

// determine which environment was passed as a command-line argument
const currentEnvironment = typeof process.env.NODE_ENV === 'string' ? 
                            process.env.NODE_ENV.toLocaleLowerCase() : '';

// check that the current env is one of the enviroments above, if not, default to staging
const environmentToExport = environments[currentEnvironment] || environments.staging;

// export
module.exports = environmentToExport;