const _data = require('../data');
const helpers = require('../helpers');

module.exports = (handlers) => {
    // create an account
    handlers.accountCreate = (data, callback) => {
        if (data.method !== 'get') {
            return callback(405, undefined, 'html');
        }

        try {
            // prepate
            const templateData = {
                'head.title': 'Create an account',
                'head.description': 'Signup is easy an only takes a few seconds.',
                'body.class': 'accountCreate'
            };

            const templateContent = helpers.getTemplate('account-create', templateData);

            // read the index template
            return callback(undefined, templateContent, 'html');
        } catch (error) {
            console.log(error);
            return callback(500, 'something went wrong!', 'html');
        }
    };

    // edit the account
    handlers.accountEdit = (data, callback) => {
        if (data.method !== 'get') {
            return callback(405, undefined, 'html');
        }

        try {
            // prepate
            const templateData = {
                'head.title': 'Account settings',
                'body.class': 'accountEdit'
            };

            const templateContent = helpers.getTemplate('account-edit', templateData);

            // read the index template
            return callback(undefined, templateContent, 'html');
        } catch (error) {
            console.log(error);
            return callback(500, 'something went wrong!', 'html');
        }
    };

    // account has been deleted
    handlers.accountDeleted = (data, callback) => {
        if (data.method !== 'get') {
            return callback(405, undefined, 'html');
        }

        try {
            // prepate
            const templateData = {
                'head.title': 'Account deleted',
                'head.description': 'Yout account has been deleted',
                'body.class': 'accountDeleted'
            };

            const templateContent = helpers.getTemplate('account-deleted', templateData);

            // read the index template
            return callback(undefined, templateContent, 'html');
        } catch (error) {
            console.log(error);
            return callback(500, 'something went wrong!', 'html');
        }
    };

};