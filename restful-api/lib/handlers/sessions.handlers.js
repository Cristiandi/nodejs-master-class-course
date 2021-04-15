const _data = require('../data');
const helpers = require('../helpers');

module.exports = (handlers) => {
    // create a session
    handlers.sessionCreate = (data, callback) => {
        if (data.method !== 'get') {
            return callback(405, undefined, 'html');
        }

        try {
            // prepate
            const templateData = {
                'head.title': 'Login to your account',
                'head.description': 'Please enter yout phone number n password',
                'body.class': 'sessionCreate'
            };

            const templateContent = helpers.getTemplate('session-create', templateData);

            // read the index template
            return callback(undefined, templateContent, 'html');
        } catch (error) {
            console.log(error);
            return callback(500, 'something went wrong!', 'html');
        }
    };

};