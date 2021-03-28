/*
* Primary file for API
*/

// Dependencies
const config = require('./config');
const http = require('http');
const https = require('https');
const StringDecoder = require('string_decoder').StringDecoder;
const fs = require('fs');
 
const handlers = require('./lib/handlers');
const helpers = require('./lib/helpers');

// define a request router
const router = {
    ping: handlers.ping,
    hello: handlers.hello,
    users: handlers.users,
    tokens: handlers.tokens,
    checks: handlers.checks
};

// all the server logic
const unifiedServer = async (req, res, httpString = 'http') => {
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
    const chosenHandler = router[trimmedPath] ? router[trimmedPath] : handlers.notFound;

    // construct the data object to send to the handler
    const data = {
        trimmedPath,
        queryStringObject,
        method,
        headers,
        payload: helpers.parseJsonToObject(buffer)
    };

    // route the request to the handler specified in the router
    chosenHandler(data, (statusCode, payload) => {
        statusCode = typeof statusCode === 'number' ? statusCode : 200;

        payload = typeof payload === 'object' ? payload : {};

        // convert the payload to a string
        const payloadString = JSON.stringify(payload);

        // return the response 
        res.setHeader('Content-Type', 'application/json');
        res.writeHead(statusCode);
        res.end(payloadString);

        // log
        console.log('returning this:', statusCode, payloadString);
    });
};

// instantiate the http server
const httpServer = http.createServer((req, res) => {
    unifiedServer(req, res, 'http');
});

// start the http server
httpServer.listen(config.httpPort, () => {
    console.log(`Ther server is on ${config.httpPort} port at ${config.envName}.`);
});

// instantiate the https server
const httpsServer = https.createServer(
{
    key: fs.readFileSync('./https/key.pem'),
    cert: fs.readFileSync('./https/cert.pem')
},
async (req, res) => {
    unifiedServer(req, res, 'https');
});

// start the https server
httpsServer.listen(config.httpsPort, () => {
    console.log(`Ther server is on ${config.httpsPort} port at ${config.envName}.`);
});