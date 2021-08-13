const os = require('os');
const v8 = require('v8');
const childProcess = require('child_process');

const _data = require('../data');
const _logs = require('../logs');
const helpers = require('../helpers');

// responder object
const responders = {};

responders.help = (cli) => {
    const commands = {
        'help': 'show this help page',
        'exit': 'kill the cli and the rest of the application.',
        'stats': 'get stats from the operating system n resources utilities',
        'list users': 'show a list of all users in the system',
        'more user info --{userId}': 'show details of a specific user',
        'list checks --up --dowm': 'show a list of all checks. Thee "--up" n "--down" are both optional',
        'more check info --{checkId}': 'show details of a specific check',
        'list logs': 'show a list of all logs in the system',
        'more log info --{fileName}': 'show details of a specific log'
    };

    // show a header
    cli.horizontalLine();
    cli.centered('CLI MANUAL');
    cli.horizontalLine();
    cli.verticalSpace(2);

    // show each command
    for (const key in commands) {
        if (Object.hasOwnProperty.call(commands, key)) {
            const value = commands[key];

            let line = '\x1b[33m' + key + '\x1b[0m'
            const padding = 60 - line.length;

            for (let i = 0; i < padding; i++) {
                line += ' ';
            }

            line += value;

            console.log(line);
            cli.verticalSpace(1);
        }
    }

    cli.verticalSpace(1);

    cli.horizontalLine();

};

responders.exit = () => {
    console.log('bye bye');
    process.exit(0);
};

responders.stats = (cli) => {
    const stats = {
        'Load Average': os.loadavg().join(' '),
        'CPU Count': os.cpus().length,
        'Free Memory': os.freemem(),
        'Current Malloced Memory': v8.getHeapStatistics().malloced_memory,
        'Peak Malloced Memory': v8.getHeapStatistics().peak_malloced_memory,
        'Allocated Heap Use (%)': Math.round((v8.getHeapStatistics().used_heap_size / v8.getHeapStatistics().total_heap_size) * 100),
        'Avaliable Heap Allocated (%)': Math.round((v8.getHeapStatistics().total_heap_size / v8.getHeapStatistics().heap_size_limit) * 100),
        'Uptime': os.uptime() + ' seconds'
    };

    // create a header for the stats
    cli.horizontalLine();
    cli.centered('SYSTEM STATS');
    cli.horizontalLine();
    cli.verticalSpace(2);

    // show each command
    for (const key in stats) {
        if (Object.hasOwnProperty.call(stats, key)) {
            const value = stats[key];

            let line = '\x1b[33m' + key + '\x1b[0m'
            const padding = 60 - line.length;

            for (let i = 0; i < padding; i++) {
                line += ' ';
            }

            line += value;

            console.log(line);
            cli.verticalSpace(1);
        }
    }

    cli.verticalSpace(1);

    cli.horizontalLine();
};

responders.listUsers = (cli) => {
    try {
        const userIds = _data.list('users');

        cli.verticalSpace(1);

        for (const userId of userIds) {
            const user = _data.read('users', userId);

            let line = 'Name: ' + user.firstName + ' Phone: ' + user.phone;
            const numberOfChecks = typeof user.checks === 'object' && Array.isArray(user.checks) && user.checks.length > 0 ? user.checks.length : 0;
            line += ' Checks: ' + numberOfChecks;

            console.log(line);

            cli.verticalSpace(1);
        }
    } catch (error) {
        console.error('sorry something went wrong:', error);
    }
};

responders.moreUserInfo = (cli, str) => {
    // get the id from the str
    const array = str.split('--');

    const userId = typeof array[1] === 'string' && array[1].trim().length > 0 ? array[1].trim() : undefined;

    if (!userId) {
        return;
    }

    const user = _data.read('users', userId);

    if (!user) {
        console.error(`the user ${userId} does not exist.`);
        return;
    }

    delete user.hashedPassword;

    // print the JSON
    cli.verticalSpace(1);

    console.dir(user, {
        colors: true
    });

    cli.verticalSpace(1);
};

responders.listCheck = (cli, str) => {
    try {
        const checkIds = _data.list('checks');

        if (!checkIds) {
            return;
        }

        cli.verticalSpace(1);

        for (const checkId of checkIds) {
            const check = _data.read('checks', checkId);

            const lowerStr = str.toLowerCase();
            const checkState = typeof check.state === 'string' ? check.state : 'down';
            const checkStateUnknown = typeof check.state === 'string' ? check.state : 'unknown';

            if (lowerStr.includes('--' + checkState)) {
                const line = 'ID: ' + check.id + ' ' + check.method.toUpperCase() + ' ' + check.protocol + '://' + check.url + ' ' + checkStateUnknown;
                console.log(line);

                continue;
            }

            if (!lowerStr.includes('--')) {
                const line = 'ID: ' + check.id + ' ' + check.method.toUpperCase() + ' ' + check.protocol + '://' + check.url + ' ' + checkStateUnknown;
                console.log(line);
            }
        }
    } catch (error) {
        console.error('sorry something went wrong:', error);
    }
};

responders.moreCheckInfo = (cli, str) => {
    // get the id from the str
    const array = str.split('--');

    const checkId = typeof array[1] === 'string' && array[1].trim().length > 0 ? array[1].trim() : undefined;

    if (!checkId) {
        return;
    }

    const check = _data.read('checks', checkId);

    if (!check) {
        console.error(`the check ${checkId} does not exist.`);
        return;
    }

    // print the JSON
    cli.verticalSpace(1);

    console.dir(check, {
        colors: true
    });

    cli.verticalSpace(1);
};

responders.listLogs = (cli) => {
    try {
        const ls = childProcess.spawn('ls', ['./.logs/']);
        ls.stdout.on('data', (data) => {
            // explode into separate lines
            const logIds = data.toString().split('\n');
            
            cli.verticalSpace(1);

            for (const logFileName of logIds) {
                if (logFileName.includes('-')) {
                    console.log(logFileName);
                    cli.verticalSpace(1);
                }
            }
        });
    } catch (error) {
        console.error('sorry, something went wrong:', error);
    }
};

responders.moreLogInfo = (cli, str) => {
    try {
        // get the id from the str
        const array = str.split('--');

        const logId = typeof array[1] === 'string' && array[1].trim().length > 0 ? array[1].trim() : undefined;

        if (!logId) {
            return;
        }

        cli.verticalSpace(1);

        const strData = _logs.decompress(logId);

        const lines = strData.split('\n');

        for (const line of lines) {
            const logObject = helpers.parseJsonToObject(line);

            if (!logObject) {
                return;
            }

            console.dir(logObject, { colors: true });

            cli.verticalSpace(1);
        }
    } catch (error) {
        console.error('sorry, something went wrong:', error);
    }
};



module.exports = responders;