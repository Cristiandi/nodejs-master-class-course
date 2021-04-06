/*
*   request handlres
*/

// dependencies
const helpers = require('../helpers');
const checksHandlers = require('./checks.handlers');
const tokensHandlers = require('./tokens.handlers');
const usersHandlers = require('./users.handlers');

// define the handlers
const handlers = {};

// ping router
handlers.ping = (data, callback) => {
    callback(200);
};

handlers.hello = (data, callback) => {
    const response = {
        message: 'Hello dude!'
    };

    callback(200, response);
};

// not found handler
handlers.notFound = (data, callback) => {
    callback(404);
};

// adding users handlers
usersHandlers(handlers);

// adding tokens handlers
tokensHandlers(handlers);

// adding checks handlers
checksHandlers(handlers);

/*
* WEB handlers
*/

handlers.index = (data, callback) => {
    if (data.method !== 'get') {
        return callback(405, undefined, 'html');
    }

    try {
        const templateContent = helpers.getTemplate('indexq');
        
        // read the index template
        return callback(undefined, templateContent, 'html');    
    } catch (error) {
        return callback(500, 'something went wrong!', 'html');
    }
};

module.exports = handlers;