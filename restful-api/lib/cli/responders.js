// responder object
const responders = {};

responders.help = () => {
    console.log('you asked for help!');
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