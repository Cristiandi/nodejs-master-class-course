/*
* CLI related things
*
*/

//

const readline = require('readline');
const util = require('util');
const events = require('events');

const debug = util.debuglog('cli');

class _events extends events{};
const e = new _events();

// instantiate the CLI module object
const cli = {};

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
        'exits',
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
