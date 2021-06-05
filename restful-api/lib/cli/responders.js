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

responders.stats = () => {
    console.log('you asked for stats!');
};

responders.listUsers = () => {
    console.log('you asked for listUsers!');
};

responders.moreUserInfo = (str) => {
    console.log('you asked for moreUserInfo!', str);
};

responders.listCheck = (str) => {
    console.log('you asked for listCheck!', str);
};

responders.moreCheckInfo = (str) => {
    console.log('you asked for moreCheckInfo!', str);
};

responders.listLogs = () => {
    console.log('you asked for listLogs!');
};

responders.moreLogInfo = (str) => {
    console.log('you asked for moreLogInfo!', str);
};



module.exports = responders;