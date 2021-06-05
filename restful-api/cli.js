/*
* Primary file for API
*/

// dependecies
const cli = require('./lib/cli');

// create app
const app = {}; 

app.init = () => {

    // start the cli, but make sure ir starts last
    setTimeout(() => {
        cli.init();
    }, 1000);
    
};

// execute
app.init();

module.exports = app;