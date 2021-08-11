/*
* Primary file for API
*/

// dependecies
const cluster = require('cluster');
const os = require('os');
const server = require('./server');
const workers = require('./workers');

// create app
const app = {}; 

app.init = (callback) => {

    if (cluster.isMaster) {
        // start workers
        workers.init();

        callback();

        // fork the process
        for (let i = 0; i < os.cpus().length; i++) {
            cluster.fork();
        }
    } else {
        // start server
        server.init();
    }
};

// execute
if (require.main === module) {
    app.init(function(){});
}

module.exports = app;