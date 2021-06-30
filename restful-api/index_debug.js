/*
* Primary file for API
*/

// start command > node inspect index_debug.js 
// console inside the debugger > repl 

// dependecies
const server = require('./server');
const workers = require('./workers');
const exampleDebuggingProblem = require('./lib/example-problem');

// create app
const app = {}; 

app.init = () => {
    // start server
    debugger;
    server.init();
    debugger;

    // start workers
    debugger;
    workers.init();
    debugger;

    //
    debugger;
    let foo = 1;
    foo = foo * foo;
    foo = foo.toString();
    debugger;

    console.log('just before the problem');

    // call the error
    debugger;
    exampleDebuggingProblem.init();
    debugger;
};

// execute
app.init();

module.exports = app;