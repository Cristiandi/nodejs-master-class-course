const _data = require('../data');
const config = require('../config');
const helpers = require('../helpers');

module.exports = (handlers) => {
    // checks
    handlers.checks = async (data, callback) => {
        const accetableMethods = ['post', 'get', 'put', 'delete'];

        console.log('data.method', data.method);

        if (accetableMethods.indexOf(data.method) < 0) {
            return callback(405);
        }

        try {
            await handlers._checks[data.method](data, callback);
        } catch (error) {
            return callback(500, { message: error.message });
        }
    };

    // container for user submethods
    handlers._checks = {};

    // checks - post
    // required data: protocol, url, method, successCodes, timeoutSeconds
    // optional data: none
    handlers._checks.post = async (data, callback) => {
        try {
            // check
            const protocol = typeof data?.payload?.protocol === 'string' && ['http', 'https'].indexOf(data?.payload?.protocol) > -1 ?
                data.payload.protocol : undefined;

            const url = typeof data?.payload?.url === 'string' && data?.payload?.url.trim().length > 0 ?
                data.payload.url.trim() : undefined;

            const method = typeof data?.payload?.method === 'string' && ['get', 'post', 'put', 'delete'].indexOf(data?.payload?.method) > -1 ?
                data.payload.method : undefined;

            let successCodes;

            if (data?.payload?.successCodes && typeof data?.payload?.successCodes === 'string') {
                successCodes = data?.payload?.successCodes.split(',').map(item => parseInt(item, 10));
            }

            let timeoutSeconds;

            if (data?.payload?.timeoutSeconds) {
                timeoutSeconds = parseInt(data?.payload?.timeoutSeconds, 10);
            }

            timeoutSeconds = typeof timeoutSeconds === 'number' && timeoutSeconds % 1 === 0 && timeoutSeconds >= 1 && timeoutSeconds <= 5 ? timeoutSeconds : undefined;

            /*
            console.log('protocol', protocol);
            console.log('url', url);
            console.log('method', method);
            console.log('successCodes', successCodes);
            console.log('timeoutSeconds', timeoutSeconds);
            */

            if (!protocol || !url || !method || !successCodes || !timeoutSeconds) {
                return callback(400, { message: 'missing required fields or inputs are invalid.' });
            }

            // get the token from headers
            const tokenId = data.headers.token;

            // verify the token
            let token = _data.read('tokens', tokenId);

            if (!token) {
                return callback(403, { message: 'can not find the token.' });
            }

            token = handlers._tokens.verifyToken(tokenId, token.userPhone);

            if (!token) {
                return callback(403, { message: 'token is invalid.' });
            }

            // lookup the user from the token
            const { userPhone } = token;

            const user = _data.read('users', userPhone);

            if (!user) {
                return callback(403, { message: 'can not get the user for that token.' });
            }

            const userChecks = typeof user.checks === 'object' && user.checks instanceof Array ?
                user.checks : [];

            // verify the number of checks of the user
            if (userChecks.length >= config.maxChecks) {
                return callback(412, { message: 'the user already has the maximun number of checks.' });
            }

            // create a random id for the check
            const checkId = helpers.createRandomString(20);

            // create the check object n include the user's phone
            const checkObject = {
                id: checkId,
                userPhone,
                protocol,
                url,
                method,
                successCodes,
                timeoutSeconds
            };

            // save the check
            _data.create('checks', checkObject.id, checkObject);

            // add the check id to the user's objects
            user.checks = userChecks;
            user.checks = [...userChecks, checkObject.id];

            // save the new user data
            _data.update('users', userPhone, user);

            return callback(200, checkObject);
        } catch (error) {
            return callback(500, { message: error.message });
        }
    };

    // checks - get
    // required data: id
    // optional data: none
    handlers._checks.get = async (data, callback) => {
        try {
            const id = typeof data?.queryStringObject.get('id') === 'string' && data?.queryStringObject.get('id').trim().length === 20 ?
                data?.queryStringObject.get('id') : undefined;

            if (!id) {
                return callback(400, { message: 'missing required fields or inputs are invalid.' });
            }

            // look up for the check
            const check = _data.read('checks', id);

            if (!check) {
                return callback(404, { message: 'the check does not exist.' });
            }

            // get the token from headers
            const tokenId = data.headers.token;

            // verify the token
            const token = handlers._tokens.verifyToken(tokenId, check.userPhone);

            if (!token) {
                return callback(403, { message: 'missing token or token is invalid.' });
            }

            return callback(200, check);
        } catch (error) {
            return callback(500, { message: error.message });
        }
    };

    // check - put
    // required data: id
    // optional data: protocol, url, method, successCodes, timeoutSeconds (one must be send)
    handlers._checks.put = async (data, callback) => {
        try {
            const id = typeof data?.payload?.uid === 'string' && data?.payload?.uid.trim().length === 20 ?
                data.payload.uid : undefined;

            // check
            const protocol = typeof data?.payload?.protocol === 'string' && ['http', 'https'].indexOf(data?.payload?.protocol) > -1 ?
                data.payload.protocol : undefined;

            const url = typeof data?.payload?.url === 'string' && data?.payload?.url.trim().length > 0 ?
                data.payload.url.trim() : undefined;

            const method = typeof data?.payload?.method === 'string' && ['get', 'post', 'put', 'delete'].indexOf(data?.payload?.method) > -1 ?
                data.payload.method : undefined;

            let successCodes;

            if (data?.payload?.successCodes && typeof data?.payload?.successCodes === 'string') {
                successCodes = data?.payload?.successCodes.split(',').map(item => parseInt(item, 10));
            }

            let timeoutSeconds;

            if (data?.payload?.timeoutSeconds) {
                timeoutSeconds = parseInt(data?.payload?.timeoutSeconds, 10);
            }

            timeoutSeconds = typeof timeoutSeconds === 'number' && timeoutSeconds % 1 === 0 && timeoutSeconds >= 1 && timeoutSeconds <= 5 ? timeoutSeconds : undefined;

            if (!id) {
                return callback(400, { message: 'missing required fields.' });
            }

            if (!protocol && !url && !method && !successCodes && !timeoutSeconds) {
                return callback(400, { message: 'missing fields to update.' });
            }

            // looking up the check
            const check = _data.read('checks', id);

            if (!check) {
                return callback(404, { message: 'can not get that check.' });
            }

            // get the token from headers
            const tokenId = data.headers.token;

            // verify the token
            const token = handlers._tokens.verifyToken(tokenId, check.userPhone);

            if (!token) {
                return callback(403, { message: 'missing token or token is invalid.' });
            }

            // update the check
            const newCheckData = {
                ...check,
                protocol: protocol || check.protocol,
                url: url || check.url,
                method: method || check.method,
                successCodes: successCodes || check.successCodes,
                timeoutSeconds: timeoutSeconds || check.timeoutSeconds
            };

            _data.update('checks', check.id, newCheckData);

            return callback(200);

        } catch (error) {
            return callback(500, { message: error.message });
        }
    };

    // checks - delete
    // required data: id
    // optional data: none
    handlers._checks.delete = async (data, callback) => {
        try {
            const id = typeof data?.queryStringObject.get('uid') === 'string' && data?.queryStringObject.get('uid').trim().length === 20 ?
                data?.queryStringObject.get('uid') : undefined;

            if (!id) {
                return callback(400, { message: 'missing required fields.' });
            }

            // looking up the check
            const check = _data.read('checks', id);

            if (!check) {
                return callback(404, { message: 'can not get that check.' });
            }

            const { userPhone } = check;

            // get the token from headers
            const tokenId = data.headers.token;

            // verify the token
            const token = handlers._tokens.verifyToken(tokenId, userPhone);

            if (!token) {
                return callback(403, { message: 'missing token or token is invalid.' });
            }

            // delete the check
            _data.delete('checks', id);

            // look up the user
            const user = _data.read('users', userPhone);

            if (!user) {
                return callback(404, { message: 'can not get the user from the check.' });
            }

            // handle the checks
            const userChecks = typeof user.checks === 'object' && user.checks instanceof Array ?
                user.checks : [];

            user.checks = userChecks.filter(item => item !== id);

            // save the new user data
            _data.update('users', userPhone, user);

            return callback(200);
        } catch (error) {
            return callback(500, { message: error.message });
        }
    };

    // create a new check
    handlers.checkCreate = (data, callback) => {
        if (data.method !== 'get') {
            return callback(405, undefined, 'html');
        }

        try {
            // prepate
            const templateData = {
                'head.title': 'Create a new check',
                'body.class': 'checksCreate'
            };

            const templateContent = helpers.getTemplate('check-create', templateData);

            // read the index template
            return callback(undefined, templateContent, 'html');
        } catch (error) {
            console.log(error);
            return callback(500, 'something went wrong!', 'html');
        }
    };

    // list all checks
    handlers.checkList = (data, callback) => {
        if (data.method !== 'get') {
            return callback(405, undefined, 'html');
        }

        try {
            // prepate
            const templateData = {
                'head.title': 'Dashboard',
                'body.class': 'checkList'
            };

            const templateContent = helpers.getTemplate('check-list', templateData);

            // read the index template
            return callback(undefined, templateContent, 'html');
        } catch (error) {
            console.log(error);
            return callback(500, 'something went wrong!', 'html');
        }
    };

    // edit check
    handlers.checkEdit = (data, callback) => {
        if (data.method !== 'get') {
            return callback(405, undefined, 'html');
        }

        try {
            // prepate
            const templateData = {
                'head.title': 'Check details',
                'body.class': 'checkEdit'
            };

            const templateContent = helpers.getTemplate('check-edit', templateData);

            // read the index template
            return callback(undefined, templateContent, 'html');
        } catch (error) {
            console.log(error);
            return callback(500, 'something went wrong!', 'html');
        }
    };
};