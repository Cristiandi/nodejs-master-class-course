const _data = require('../data');
const config = require('../../config');
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

            const successCodes = typeof data?.payload?.successCodes === 'object' && data?.payload?.successCodes instanceof Array && data?.payload?.successCodes.length > 0 ?
                data.payload.successCodes : undefined;

            const timeoutSeconds = typeof data?.payload?.timeoutSeconds === 'number' && data?.payload?.timeoutSeconds % 1 === 0 && data?.payload?.timeoutSeconds >= 1 && data?.payload?.timeoutSeconds <= 5 ?
                data.payload.timeoutSeconds : undefined;

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
            const id = typeof data?.payload?.id === 'string' && data?.payload?.id.trim().length === 20 ?
                data.payload.id : undefined;

            const protocol = typeof data?.payload?.protocol === 'string' && ['http', 'https'].indexOf(data?.payload?.protocol) > -1 ?
                data.payload.protocol : undefined;

            const url = typeof data?.payload?.url === 'string' && data?.payload?.url.trim().length > 0 ?
                data.payload.url.trim() : undefined;

            const method = typeof data?.payload?.method === 'string' && ['get', 'post', 'put', 'delete'].indexOf(data?.payload?.method) > -1 ?
                data.payload.method : undefined;

            const successCodes = typeof data?.payload?.successCodes === 'object' && data?.payload?.successCodes instanceof Array && data?.payload?.successCodes.length > 0 ?
                data.payload.successCodes : undefined;

            const timeoutSeconds = typeof data?.payload?.timeoutSeconds === 'number' && data?.payload?.timeoutSeconds % 1 === 0 && data?.payload?.timeoutSeconds >= 1 && data?.payload?.timeoutSeconds <= 5 ?
                data.payload.timeoutSeconds : undefined;
            
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
            const id = typeof data?.queryStringObject.get('id') === 'string' && data?.queryStringObject.get('id').trim().length === 20 ?
                data?.queryStringObject.get('id') : undefined;

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
};