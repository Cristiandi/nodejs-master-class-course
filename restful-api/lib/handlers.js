/*
*   request handlres
*/

// dependencies
const _data = require('./data');
const helpers = require('./helpers');

// define the handlers
const handlers = {};

// ping router
handlers.ping = (data, callback) => {
    callback(200);
};

handlers.hello = (data, callback) => {
    const response = {
        message: 'Hello dude!'
    };

    callback(200, response);
};

// not found handler
handlers.notFound = (data, callback) => {
    callback(404);
};

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

        // get the token from headers
        const tokenId = data.headers.token;

        // verify the token
        const token = handlers._tokens.verifyToken(tokenId, phone);

        if (!token) {
            return callback(403, { message: 'missing token or token is invalid.' });
        }

        if (!firstName && !lastName && !password) {
            return callback(400, { message: 'missing fields to updated.' });
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

        callback(200);
    } catch (error) {
        return callback(500, { message: error.message });
    }
};

// tokens
handlers.tokens = async (data, callback) => {
    const accetableMethods = ['post', 'get', 'put', 'delete'];

    console.log('data.method', data.method);

    if (accetableMethods.indexOf(data.method) < 0) {
        return callback(405);
    }

    try {
        await handlers._tokens[data.method](data, callback);
    } catch (error) {
        callback(500, { message: error.message });
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
            tokenId,
            phone,
            tokenExpires
        };

        // store the token
        _data.create('tokens', tokenId, tokenObject);

        callback(200, tokenObject);
    } catch (error) {
        callback(500, { message: error.message });
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

        callback(200, token);
    } catch (error) {
        callback(500, { message: error.message });
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

        _data.update('tokens', newTokenData.tokenId, newTokenData);

        callback(200);
    } catch (error) {
        callback(500, { message: error.message });
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

        callback(200);
    } catch (error) {
        return callback(500, { message: error.message });
    }
}

// verify if a given id is currently valid for a given user
handlers._tokens.verifyToken = (tokenId, phone) => {
    const token = _data.read('tokens', tokenId);

    if (!token) return null;

    if (token.phone !== phone || token.tokenExpires < Date.now()) {
        return null;
    }

    return token;
};

module.exports = handlers;