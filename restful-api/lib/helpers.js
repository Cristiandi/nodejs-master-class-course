/*
* helpers for various tasks
*/

// dependencies
const crypto = require('crypto');

const config = require('../config');


// container

const helpers = {};

helpers.hash = (value) => {
    console.log('going to hash', value);
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

module.exports = helpers;