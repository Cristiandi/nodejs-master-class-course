/*
* CLI related things
*
*/

//

const readline = require('readline');
const util = require('util');
const events = require('events');

// responder object
const responders = require('./responders'); 

const debug = util.debuglog('cli');

class _events extends events{};
const e = new _events();

// instantiate the CLI module object
const cli = {};

cli.horizontalLine = () => {
    // get the scree size
    const width = process.stdout.columns;

    let line = '';

    for (let i = 0; i < width; i++) {
        line += '-';
        
    }
    
    console.log(line);
};

cli.centered = str => {
    const width = process.stdout.columns;

    const leftPadding = Math.floor((width - str.length) / 2);

    let line = '';

    for (let i = 0; i < leftPadding; i++) {
        line += ' ';
        
    }

    line += str;

    console.log(line);
};

cli.verticalSpace = (lines = 0) => {
    for (let i = 0; i < lines; i++) {
        console.log('');        
    }
};

// input handlers
e.on('help', str => {
    responders.help(cli);
});

e.on('exit', str => {
    responders.exit();
});

e.on('stats', str => {
    responders.stats();
});

e.on('list users', str => {
    responders.listUsers();
});

e.on('more user info', str => {
    responders.moreUserInfo(str);
});

e.on('list checks', str => {
    responders.listCheck(str);
});

e.on('more check info', str => {
    responders.moreCheckInfo(str);
});

e.on('list logs', str => {
    responders.listLogs();
});

e.on('more log info', str => {
    responders.moreLogInfo(str);
});

// input processor
cli.processInput = (str = '' ) => {
    if (typeof str !== 'string') {
        return;
    }
    if (str.trim().length < 1) {
        return;
    }

    // codify the unique strings
    const uniqueInputs = [
        'help',
        'exit',
        'stats',
        'list users',
        'more user info',
        'list checks',
        'more check info',
        'list logs',
        'more log info'
    ];

    let matchFound = false;

    // find the possible match n emit an event when is found
    for (const input of uniqueInputs) {
        if (str.toLocaleLowerCase().includes(input)) {
            matchFound = true;
            
            // emit the event
            e.emit(input, str);

            break;
        }
    }

    // if no match is found, tell the user to try again
    if (!matchFound) {
        console.log('Sorry, try again.');
    }
};

cli.init = () => {
    // send the start message to the console
    console.log('\x1b[34m%s\x1b[0m', `Ther CLI is running.`);

    // start the interface
    const _interface = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
        prompt: ''
    });

    // create n initial the prompt
    _interface.prompt();

    // handle each line of input separately
    _interface.on('line', (str) => {
        // send to the input processor
        cli.processInput(str);

        // re initialize the prompt
        _interface.prompt();
    });

    // if the user stop the CLI, kill the associated process
    _interface.on('close', () => process.exit(0));
};

module.exports = cli;
