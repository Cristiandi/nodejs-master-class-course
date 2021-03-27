/*
* helpers for various tasks
*/

// dependencies
const crypto = require('crypto');

const config = require('../config');


// container

const helpers = {};

helpers.hash = (value) => {
    if (!value || !typeof value === 'string') {
        throw new Error('the value must be a non empty string.');
    }

    const hash = crypto.createHmac('sha256', config.hashingSecret)
        .update(value)
        .digest('hex');

    return hash;
};

// parse json string without throwing error

helpers.parseJsonToObject = (value) => {
    try {
        const object = JSON.parse(value);
        return object;
    } catch (error) {
        return {};
    }
};

helpers.createRandomString = (length) => {
    length = typeof length === 'number' && length > 0 ? length : undefined;

    if (!length) {
        throw new Error('the length must be a number.');
    }

    // define al the possible char
    const possibleCharacters = 'abcdefghijklmnopqrstuvwxyz0123456789';

    // start the string
    let str = '';

    for (let i = 0; i < length; i++) {
        const randomChar = possibleCharacters.charAt(Math.floor(Math.random() * possibleCharacters.length));

        str += randomChar;
    }

    return str;
};

module.exports = helpers;