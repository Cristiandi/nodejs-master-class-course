/*
* create n export configuration vars
*/


// container for all environments

const environments = {};

// staging (default) object
environments.staging = {
    httpPort: 3000,
    httpsPort: 3001,
    envName: 'staging',
    hashingSecret: process.env.HASHING_SECRET || 'superSecretDude',
    maxChecks: 5,
    twilio: {
        accountSID: process.env.TWILIO_ACCOUNT_SID || 'AC1d9b0a41fb85dde59717c415dacf68e8',
        authToken: process.env.TWILIO_AUTH_TOKEN || 'e0fd7290c8a704bd0933377e293e9669',
        phoneNumber: process.env.TWILIO_PHONE_NUMBER || '+18587990144'
    },
    templateGlobals: {
        appName: 'UptimeChecker',
        companyName: 'Divelo Company',
        yearCreated: new Date().getFullYear().toString(),
        baseUrl: 'http://localhost:3000/'
    }
};

// production object
environments.production = {
    httpPort: 4000,
    httpsPort: 4001,
    envName: 'production',
    hashingSecret: process.env.HASHING_SECRET || 'superSecretDude',
    maxChecks: 5,
    twilio: {
        accountSID: process.env.TWILIO_ACCOUNT_SID || '',
        authToken: process.env.TWILIO_AUTH_TOKEN || '',
        phoneNumber: process.env.TWILIO_PHONE_NUMBER || ''
    },
    templateGlobals: {
        appName: 'UptimeChecker',
        companyName: 'Divelo Company',
        yearCreated: new Date().getFullYear().toString(),
        baseUrl: 'http://localhost:4000/'
    }
};

// determine which environment was passed as a command-line argument
const currentEnvironment = typeof process.env.NODE_ENV === 'string' ? 
                            process.env.NODE_ENV.toLocaleLowerCase() : '';

// check that the current env is one of the enviroments above, if not, default to staging
const environmentToExport = environments[currentEnvironment] || environments.staging;

// export
module.exports = environmentToExport;