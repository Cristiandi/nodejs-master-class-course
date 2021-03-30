/*
* Primary file for API
*/

// dependecies
const server = require('./server');
const workers = require('./workers');

// create app
const app = {}; 

app.init = () => {
    // start server
    server.init();

    // start workers
    workers.init();
};

// execute
app.init();

module.exports = app;