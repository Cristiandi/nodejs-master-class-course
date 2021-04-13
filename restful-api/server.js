/*
* Server related tasks
*/

// Dependencies
const config = require('./lib/config');
const http = require('http');
const https = require('https');
const StringDecoder = require('string_decoder').StringDecoder;
const fs = require('fs');
const util = require('util')

const handlers = require('./lib/handlers');
const helpers = require('./lib/helpers');

const debug = util.debuglog('server');

// instantiate the server module object
const server = {};

// define a request router
server.router = {
    'favicon.ico': handlers.favicon,
    'public': handlers.public,
    '': handlers.index,
    'account/create': handlers.accountCreate,
    'account/edit': handlers.accountEdit,
    'account/deleted': handlers.accountDeleted,
    'sessions/create': handlers.sessionCreate,
    'sessions/deleted': handlers.sessionDeleted,
    'checks/all': handlers.checkList,
    'checks/create': handlers.checkCreate,
    'checks/edit': handlers.checkEdit,
    ping: handlers.ping,
    'api/hello': handlers.hello,
    'api/users': handlers.users,
    'api/tokens': handlers.tokens,
    'api/checks': handlers.checks
};

// all the server logic
server.unifiedServer = async (req, res, httpString = 'http') => {
    // get the url n parse it
    const baseURL = httpString + '://' + req.headers.host + '/';

    const parsedUrl = new URL(req.url, baseURL);

    // get the path
    const path = parsedUrl.pathname;
    const trimmedPath = path.replace(/^\/+|\/+$/g, '');

    // get the query string as object
    const queryStringObject = parsedUrl.searchParams;

    // get the http method
    const method = req.method.toLocaleLowerCase();

    // get the headers as an object
    const headers = req.headers;

    // get the payload if any
    const decoder = new StringDecoder('utf-8');
    let buffer = '';

    req.on('data', (data) => {
        buffer += decoder.write(data);
    });

    const requestEndPromise = new Promise((resolve, reject) => {
        req.on('end', () => {
            try {
                buffer += decoder.end();
                return resolve();
            } catch (error) {
                return reject(error);
            }
        });
    });

    await requestEndPromise;

    // chosee the handler this request should go to
    // if one not found use the not found handler
    let chosenHandler = server.router[trimmedPath] ? server.router[trimmedPath] : handlers.notFound;

    // if the request is public
    chosenHandler = trimmedPath.includes('public/') ? handlers.public : chosenHandler;

    // construct the data object to send to the handler
    const data = {
        trimmedPath,
        queryStringObject,
        method,
        headers,
        payload: helpers.parseJsonToObject(buffer)
    };

    // route the request to the handler specified in the router
    chosenHandler(data, (statusCode, payload, contentType = 'json') => {
        contentType = typeof contentType === 'string' ? contentType : 'json';

        statusCode = typeof statusCode === 'number' ? statusCode : 200;

        let payloadToResponse = '';

        if (contentType === 'json') {
            res.setHeader('Content-Type', 'application/json');

            payload = typeof payload === 'object' ? payload : {};

            // convert the payload to a string
            payloadToResponse = JSON.stringify(payload);
        } else  if (contentType === 'html') {
            res.setHeader('Content-Type', 'text/html');

            payloadToResponse = typeof payload === 'string' ? payload : '';
        } else  if (contentType === 'favicon') {
            res.setHeader('Content-Type', 'image/x-icon');

            payloadToResponse = typeof payload !== 'undefined' ? payload : '';
        } else  if (contentType === 'css') {
            
            res.setHeader('Content-Type', 'text/css');

            payloadToResponse = typeof payload !== 'undefined' ? payload : '';
        } else  if (contentType === 'png') {
            res.setHeader('Content-Type', 'image/png');

            payloadToResponse = typeof payload !== 'undefined' ? payload : '';
        } else  if (contentType === 'jpg') {
            res.setHeader('Content-Type', 'image/jpeg');

            payloadToResponse = typeof payload !== 'undefined' ? payload : '';
        } else  if (contentType === 'plain') {
            res.setHeader('Content-Type', 'text/plain');

            payloadToResponse = typeof payload !== 'undefined' ? payload : '';
        }

        // return the response 
        res.writeHead(statusCode);
        res.end(payloadToResponse);

        // log
        if (`${statusCode}`.startsWith('2')) {
            debug('\x1b[32m%s\x1b[0m', `${method.toUpperCase()} / ${trimmedPath} ${statusCode}`, payloadToResponse);
        } else {
            debug('\x1b[32m%s\x1b[0m', `${method.toUpperCase()} / ${trimmedPath} ${statusCode}`, payloadToResponse);
        }
    });
};

// instantiate the http server
server.httpServer = http.createServer((req, res) => {
    server.unifiedServer(req, res, 'http');
});

// instantiate the https server
server.httpsServer = https.createServer(
    {
        key: fs.readFileSync('./https/key.pem'),
        cert: fs.readFileSync('./https/cert.pem')
    },
    async (req, res) => {
        server.unifiedServer(req, res, 'https');
    }
);

server.init = () => {
    // start the http server
    server.httpServer.listen(config.httpPort, () => {
        console.log('\x1b[36m%s\x1b[0m', `Ther server is on ${config.httpPort} port at ${config.envName}.`);
    });

    // start the https server
    server.httpsServer.listen(config.httpsPort, () => {
        console.log('\x1b[35m%s\x1b[0m', `Ther server is on ${config.httpsPort} port at ${config.envName}.`);
    });

};

module.exports = server;