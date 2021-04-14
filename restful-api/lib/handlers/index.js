/*
*   request handlres
*/

// dependencies
const helpers = require('../helpers');
const checksHandlers = require('./checks.handlers');
const tokensHandlers = require('./tokens.handlers');
const usersHandlers = require('./users.handlers');
const accountHandlers = require('./account.handlers')

// define the handlers
const handlers = {};

// ping router
handlers.ping = (data, callback) => {    
    const response = {
        message: 'pong'
    };

    return callback(200, response);
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

handlers.favicon = (data, callback) => {
    if (data.method !== 'get') {
        return callback(405, undefined, 'html');
    }

    try {
        const faviconAsset = helpers.getStaticAsset('favicon.ico');

        callback(200, faviconAsset, 'favicon');
    } catch (error) {
        console.error(error);
        return callback(404,undefined, 'html');
    }
};

handlers.public = (data, callback) => {
    if (data.method !== 'get') {
        return callback(405, undefined, 'html');
    }

    // get the file name
    const trimmedAssetName = data.trimmedPath.replace('public/', '').trim();

    if (!trimmedAssetName.length) {
        return callback(404, undefined, 'html');
    }

    // console.log('trimmedAssetName', trimmedAssetName);

    // read the file in assets
    try {
        const assetContent = helpers.getStaticAsset(trimmedAssetName);

        // determine the content type
        let contentType = 'plain';

        if (trimmedAssetName.includes('.css')) contentType = 'css';

        if (trimmedAssetName.includes('.png')) contentType = 'png';

        if (trimmedAssetName.includes('.jpg')) contentType = 'jpg';

        if (trimmedAssetName.includes('.ico')) contentType = 'favicon';

        return callback(200, assetContent, contentType);
    } catch (error) {
        console.error(error);
        return callback(404,undefined, 'html');
    }
};

handlers.index = (data, callback) => {
    if (data.method !== 'get') {
        return callback(405, undefined, 'html');
    }

    try {
         // prepate
         const templateData = {
            'head.title': 'Uptime monitoring - Made Simple',
            'head.description': 'We offer uptime monitoring for HTTP/HTTPS',
            'body.class': 'index'
        };

        const templateContent = helpers.getTemplate('index', templateData);
        
        // read the index template
        return callback(undefined, templateContent, 'html');    
    } catch (error) {
        console.log(error);
        return callback(500, 'something went wrong!', 'html');
    }
};

accountHandlers(handlers);

module.exports = handlers;