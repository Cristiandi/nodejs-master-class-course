/*
* Primary file for API
*/

// dependecies
const server = require('./server');
const workers = require('./workers');

// create app
const app = {}; 

app.init = (callback) => {
    // start server
    server.init();

    // start workers
    workers.init();

    callback();
};

// execute
if (require.main === module) {
    app.init(function(){});
}

module.exports = app;