const _data = require('../data');
const helpers = require('../helpers');

module.exports = (handlers) => {
    // users
    handlers.users = async (data, callback) => {
        const accetableMethods = ['post', 'get', 'put', 'delete'];

        console.log('data.method', data.method);

        if (accetableMethods.indexOf(data.method) < 0) {
            return callback(405);
        }

        try {
            await handlers._users[data.method](data, callback);
        } catch (error) {
            callback(500, { message: error.message });
        }
    };

    // container for user submethods
    handlers._users = {};

    // users - post
    // requiered data: firstName, lastName, phone, password, tosAgreement
    // optional deta: none
    handlers._users.post = async (data, callback) => {
        try {
            // check
            const firstName = typeof data?.payload?.firstName === 'string' && data?.payload?.firstName.trim().length > 0 ?
                data.payload.firstName : undefined;

            const lastName = typeof data?.payload?.lastName === 'string' && data?.payload?.lastName.trim().length > 0 ?
                data.payload.lastName : undefined;

            const phone = typeof data?.payload?.phone === 'string' && data?.payload?.phone.trim().length === 10 ?
                data.payload.phone : undefined;

            const password = typeof data?.payload?.password === 'string' && data?.payload?.password.trim().length > 0 ?
                data.payload.password : undefined;

            const tosAgreement = typeof data?.payload?.tosAgreement === 'boolean' ?
                data.payload.tosAgreement : false;


            if (!firstName || !lastName || !phone || !password || !tosAgreement) {
                return callback(400, { message: 'missing required fields.' });
            }

            // check if the user doesn't exist
            const content = _data.read('users', phone);

            if (content) {
                // user with that phone already exists
                return callback(412, { message: 'user with that phone already exists.' });
            }

            // hash password
            const hashedPassword = helpers.hash(password);

            // create user object
            const userObject = {
                firstName,
                lastName,
                phone,
                hashedPassword,
                tosAgreement
            };

            // store the user
            _data.create('users', phone, userObject);

            return callback(200);
        } catch (error) {
            return callback(500, { message: error.message });
        }


    };

    // users - get
    // requiered data: phone
    // optional deta: none
    handlers._users.get = async (data, callback) => {
        try {
            const phone = typeof data?.queryStringObject.get('phone') === 'string' && data?.queryStringObject.get('phone').trim().length === 10 ?
                data?.queryStringObject.get('phone') : undefined;

            if (!phone) {
                return callback(400, { message: 'missing required fields.' });
            }

            // get the token from headers
            const tokenId = data.headers.token;

            // verify the token
            const token = handlers._tokens.verifyToken(tokenId, phone);

            if (!token) {
                return callback(403, { message: 'missing token or token is invalid.' });
            }

            const user = _data.read('users', phone);

            if (!user) {
                return callback(404, { message: 'the user does not exist.' });
            }

            delete user.hashedPassword;

            callback(200, user);
        } catch (error) {
            return callback(500, { message: error.message });
        }
    };

    // users - put
    // requiered data: phone
    // optional data: firstName, lastName, password, tosAgreement (at least one)
    handlers._users.put = async (data, callback) => {
        try {
            const phone = typeof data?.payload?.phone === 'string' && data?.payload?.phone.trim().length === 10 ?
                data.payload.phone : undefined;

            const firstName = typeof data?.payload?.firstName === 'string' && data?.payload?.firstName.trim().length > 0 ?
                data.payload.firstName : undefined;

            const lastName = typeof data?.payload?.lastName === 'string' && data?.payload?.lastName.trim().length > 0 ?
                data.payload.lastName : undefined;

            const password = typeof data?.payload?.password === 'string' && data?.payload?.password.trim().length > 0 ?
                data.payload.password : undefined;

            if (!phone) {
                return callback(400, { message: 'missing required fields.' });
            }

            if (!firstName && !lastName && !password) {
                return callback(400, { message: 'missing fields to updated.' });
            }

            // get the token from headers
            const tokenId = data.headers.token;

            // verify the token
            const token = handlers._tokens.verifyToken(tokenId, phone);

            if (!token) {
                return callback(403, { message: 'missing token or token is invalid.' });
            }

            // look for users
            const user = _data.read('users', phone);

            if (!user) {
                return callback(404, { message: 'the user does not exist.' });
            }

            const newUserData = {
                ...user,
                firstName: firstName || user.firstName,
                lastName: lastName || user.lastName,
                hashedPassword: password ? helpers.hash(password) : user.hashedPassword
            };

            _data.update('users', phone, newUserData);

            callback(200);
        } catch (error) {
            return callback(500, { message: error.message });
        }
    };

    // users - delete
    // requiered data: phone
    // optional data: none
    handlers._users.delete = async (data, callback) => {
        try {
            const phone = typeof data?.queryStringObject.get('phone') === 'string' && data?.queryStringObject.get('phone').trim().length === 10 ?
                data?.queryStringObject.get('phone') : undefined;

            if (!phone) {
                return callback(400, { message: 'missing required fields.' });
            }

            // get the token from headers
            const tokenId = data.headers.token;

            // verify the token
            const token = handlers._tokens.verifyToken(tokenId, phone);

            if (!token) {
                return callback(403, { message: 'missing token or token is invalid.' });
            }

            // look for users
            const user = _data.read('users', phone);

            if (!user) {
                return callback(404, { message: 'the user does not exist.' });
            }

            _data.delete('users', phone);

            // delete user's checks
            const userChecks = typeof user.checks === 'object' && user.checks instanceof Array ?
                user.checks : [];

            for (const checkId of userChecks) {
                try {
                    _data.delete('checks', checkId);
                } catch (error) {
                    console.error(error);
                }
            }

            callback(200);
        } catch (error) {
            return callback(500, { message: error.message });
        }
    };
};