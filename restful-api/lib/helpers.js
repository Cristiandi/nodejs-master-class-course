/*
* helpers for various tasks
*/

// dependencies
const crypto = require('crypto');
const querystring = require('querystring');
const https = require('https');
const path = require('path');
const fs = require('fs');

const config = require('./config');


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

// send sms via twilio
helpers.sendTwilioSMS = async (phone, message) => {
    // validate
    if (typeof phone !== 'string' && phone.trim().length !== 10) {
        throw new Error('phone is invalid.');
    }

    if (typeof message !== 'string' && message.trim().length < 5) {
        throw new Error('message is invalid.');
    }

    // configue payload
    const payload = {
        From: config.twilio.phoneNumber,
        To: `+57${phone}`,
        Body: message
    };

    // console.log(payload);

    const payloadString = querystring.stringify(payload);

    // make the request

    const promiseRequest = new Promise((resolve, reject) => {
        const requestOptions = {
            protocol: 'https:',
            hostname: 'api.twilio.com',
            method: 'POST',
            path: `/2010-04-01/Accounts/${config.twilio.accountSID}/Messages.json`,
            auth: `${config.twilio.accountSID}:${config.twilio.authToken}`,
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Content-Length': Buffer.byteLength(payloadString)
            }
        };

        // console.log('reqDetail', requestOptions);

        const req = https.request(requestOptions, (res) => {
            const status = res.statusCode;

            // handling the response
            let buffer = '';
            res.setEncoding('utf8');
            res.on('data', (chunk) => {
                buffer += chunk;
            });
            res.on('end', () => {
                let response;
                try {
                    response = JSON.parse(buffer);
                } catch (error) {
                    response = {};
                }

                if (status === 200 || status === 201) {
                    return resolve(response);
                }

                return reject(response.message ? new Error(response.message) : new Error(`request fail with status ${status}`));
            });
            res.on('error', (e) => reject(e));
        });

        //
        req.on('error', (e) => reject(e));

        // add the payload
        req.write(payloadString, 'utf-8');

        // end the request
        req.end();
    });

    const result = await promiseRequest;

    return result;
};

// get the string content of a template
helpers.getTemplate = (templateName, data = {}) => {
    if (!templateName) {
        throw new Error('a valid template name was not specified!');
    }

    const templatesDir = path.join(__dirname, '../templates');

    const headerContent = fs.readFileSync(`${templatesDir}/_header.html`, 'utf-8');
    
    let templateContent = fs.readFileSync(templatesDir + '/' + templateName + '.html', 'utf-8');

    const footerContent = fs.readFileSync(`${templatesDir}/_footer.html`, 'utf-8');

    templateContent = headerContent + templateContent + footerContent;

    templateContent = helpers.interpolate(templateContent, data); 

    console.log(templateContent);

    return templateContent;
};

// take a given string 
helpers.interpolate = (str, data) => {
    if (typeof str !== 'string') {
        throw new Error('helpers.interpolate | str is not valid');
    }
    if (!str.length) {
        throw new Error('helpers.interpolate | str is not valid');
    }

    if (typeof data !== 'object') {
        throw new Error('helpers.interpolate | data is not valid');
    }
    if (!data) {
        throw new Error('helpers.interpolate | data is not valid');
    }

    let globals = {};

    const { templateGlobals } = config;

    // add the template globals
    for (const key in templateGlobals) {
        if (Object.hasOwnProperty.call(templateGlobals, key)) {
            const element = templateGlobals[key];
            globals['global.' + key] = element;
        }
    }

    const nestedData = {
        ...data,
        ...globals
    };

    let replacedString = str;

    for (const key in nestedData) {
        if (Object.hasOwnProperty.call(nestedData, key) && typeof nestedData[key] === 'string') {
            const replpace = nestedData[key];
            const find = `{${key}}`;
            replacedString = replacedString.replace(find, replpace);
        }
    }

    return replacedString;
};

module.exports = helpers;