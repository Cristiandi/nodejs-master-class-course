const _data = require('../data');
const helpers = require('../helpers');

module.exports = (handlers) => {
    // tokens
    handlers.tokens = async (data, callback) => {
        const accetableMethods = ['post', 'get', 'put', 'delete'];

        if (accetableMethods.indexOf(data.method) < 0) {
            return callback(405);
        }

        try {
            await handlers._tokens[data.method](data, callback);
        } catch (error) {
            return callback(500, { message: error.message });
        }
    };

    // container for user submethods
    handlers._tokens = {};

    // tokens - post
    // required data: phone, password
    // optional data: none
    handlers._tokens.post = async (data, callback) => {
        try {
            // check
            const phone = typeof data?.payload?.phone === 'string' && data?.payload?.phone.trim().length === 10 ?
                data.payload.phone : undefined;

            const password = typeof data?.payload?.password === 'string' && data?.payload?.password.trim().length > 0 ?
                data.payload.password : undefined;

            if (!phone || !password) {
                return callback(400, { message: 'missing required fields.' });
            }

            // look up for the user
            const user = _data.read('users', phone);

            if (!user) {
                return callback(404, { message: 'the user does not exist.' });
            }

            // hash the sent password n compare it
            const hashedPassword = helpers.hash(password);

            if (hashedPassword !== user.hashedPassword) {
                return callback(401, { message: 'the password is incorrect.' });
            }

            // create a new token
            const tokenId = helpers.createRandomString(20);
            const tokenExpires = Date.now() + 1000 * 60 * 60;
            const tokenObject = {
                id: tokenId,
                userPhone: phone,
                tokenExpires
            };

            // store the token
            _data.create('tokens', tokenId, tokenObject);

            return callback(200, tokenObject);
        } catch (error) {
            return callback(500, { message: error.message });
        }
    };

    // tokens - get
    // requiered data: id
    // optional data: none
    handlers._tokens.get = async (data, callback) => {
        try {
            // check
            const id = typeof data?.queryStringObject.get('id') === 'string' ?
                data?.queryStringObject.get('id') : undefined;

            if (!id) {
                return callback(400, { message: 'missing required fields.' });
            }

            const token = _data.read('tokens', id);

            if (!token) {
                return callback(404, { message: 'the token does not exist.' });
            }

            return callback(200, token);
        } catch (error) {
            return callback(500, { message: error.message });
        }
    };

    // tokens - put
    // requiered data: id, extend
    // optional data: none
    handlers._tokens.put = async (data, callback) => {
        try {
            // check
            const id = typeof data?.payload?.id === 'string' ?
                data?.payload?.id : undefined;

            const extend = typeof data?.payload?.extend === 'boolean' ?
                data.payload.extend : false;

            if (!id || !extend) {
                return callback(400, { message: 'missing required fields.' });
            }

            // get the token
            const token = _data.read('tokens', id);

            if (!token) {
                return callback(404, { message: 'the token does not exist.' });
            }


            if (token.tokenExpires < Date.now()) {
                return callback(412, { message: 'the token is already expired.' });
            }

            const newTokenData = {
                ...token,
                tokenExpires: Date.now() + 1000 * 60 * 60
            };

            _data.update('tokens', newTokenData.id, newTokenData);

            return callback(200);
        } catch (error) {
            return callback(500, { message: error.message });
        }
    };

    // tokens - delete
    // requiered data: id
    // optional data: none
    handlers._tokens.delete = async (data, callback) => {
        try {
            const id = typeof data?.queryStringObject.get('id') === 'string' ?
                data?.queryStringObject.get('id') : undefined;

            if (!id) {
                return callback(400, { message: 'missing required fields.' });
            }

            // look for the token
            const token = _data.read('tokens', id);

            if (!token) {
                return callback(404, { message: 'the token does not exist.' });
            }

            _data.delete('tokens', id);

            return callback(200);
        } catch (error) {
            return callback(500, { message: error.message });
        }
    }

    // verify if a given id is currently valid for a given user
    handlers._tokens.verifyToken = (tokenId, phone) => {
        const token = _data.read('tokens', tokenId);

        if (!token) return null;

        if (token.userPhone !== phone || token.tokenExpires < Date.now()) {
            return null;
        }

        return token;
    };
};