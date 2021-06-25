/*
* worker related task
*/

// dependencies
const path = require('path');
const fs = require('fs');
const http = require('http');
const https = require('https');
const util = require('util');

const _data = require('./lib/data');
const helpers = require('./lib/helpers');
const _logs = require('./lib/logs');

const debug = util.debuglog('workers');

const workers = {};

workers.alertUserStatusChange = async (check) => {
    const message = 'Ey ' +
    check.protocol + '://' + check.url + ' is currently ' + check.state;

    await helpers.sendTwilioSMS(check.userPhone, message);

    debug('user:', check.userPhone, ' for check:', check.id, ' was alerted!');
};

workers.processCheckOutcome = async (check, checkOutcome) => {
    // decide if the check if up or down
    const state =  !checkOutcome.error && checkOutcome.responseCode && 
                    check.successCodes.includes(checkOutcome.responseCode) ? 'up' : 'down';

    // const alertWarranted = check.lastCheck && check.state !== state;
    const alertWarranted = check.state !== state;

    const newCheck = { ...check, state, lastCheck: Date.now() };

    try {
        workers.log(newCheck, checkOutcome, state, alertWarranted, newCheck.lastCheck);    
    } catch (error) {
        console.error(error);
    }

    _data.update('checks', newCheck.id, newCheck);

    if (alertWarranted) {
        await workers.alertUserStatusChange(newCheck);
    } else {
        debug('no alert needed for user:', check.userPhone, ' check:', check.id);
    }
};

// perform check
workers.performCheck = async (check) => {
    // prepare the initial check outcome
    const checkOutcome = {
        error: undefined,
        responseCode: undefined
    };

    // parse the host name
    const checkUrlArray = check.url.split('/');
    const baseURL = check.protocol + '://' + checkUrlArray[0];
    const urlToCheck = checkUrlArray.slice(1).join('/');
    // debug('urlToCheck', urlToCheck);
    const parsedUrl = new URL(urlToCheck, baseURL);

    // debug('parsedUrl', parsedUrl);

    const path = parsedUrl.pathname + (parsedUrl.searchParams.toString() ? `?${parsedUrl.searchParams.toString()}` : '');

    // debug('path', path);

    const promiseRequest = new Promise((resolve, reject) => {
        const requestOptions = {
            protocol: `${check.protocol}:`,
            hostname: parsedUrl.hostname,
            method: check.method.toUpperCase(),
            path,
            timeout: check.timeoutSeconds * 1000
        };

        const _moduleToUse = check.protocol === 'http' ? http : https;

        const req = _moduleToUse.request(requestOptions, (res) => {
            const status = res.statusCode;

            // handling the response
            let buffer = '';
            res.setEncoding('utf8');
            res.on('data', (chunk) => {
                buffer += chunk;
            });
            res.on('end', () => {
                return resolve(status);
            });
            res.on('error', (e) => reject(e));
        });

        req.on('timeout', () => reject(new Error('timeout')));

        //
        req.on('error', (e) => reject(e));

        // end the request
        req.end();
    });

    try {
        const responseCode = await promiseRequest;

        checkOutcome.responseCode = responseCode;
    } catch (error) {
        checkOutcome.error = {
            error: true,
            value: error
        };
    }

    await workers.processCheckOutcome(check, checkOutcome);
};

// sanity checking the check data
workers.validateCheckData = async (check) => {
    if (typeof check !== 'object' || !check) {
        throw new Error('invalid check object.');
    }

    if (typeof check.id !== 'string') {
        throw new Error('invalid check id.');
    }

    if (typeof check.protocol !== 'string' || ['http', 'https'].indexOf(check.protocol) < 0) {
        throw new Error('invalid check protocol.');
    }

    if (typeof check.url !== 'string') {
        throw new Error('invalid check.url.');
    }

    if (typeof check.method !== 'string' || ['post', 'get', 'put', 'delete'].indexOf(check.method) < 0) {
        throw new Error('invalid check.method.');
    }

    if (typeof check.successCodes !== 'object' || !check.successCodes instanceof Array) {
        throw new Error('invalid check.successCodes.');
    }

    if (check.successCodes.length < 1) {
        throw new Error('invalid check.successCodes.');
    }

    if (typeof check.timeoutSeconds !== 'number' || check.timeoutSeconds % 1 !== 0) {
        throw new Error('invalid check.timeoutSeconds.');
    }

    const checkClone = { ...check };

    // adding others keys
    checkClone.state = typeof checkClone.state === 'string' && ['up', 'down'].indexOf(checkClone.state) > -1 ? checkClone.state : 'down';
    checkClone.lastCheck = typeof checkClone.lastCheck !== 'number' && checkClone.lastCheck > 0 ? checkClone.lastCheck : undefined;

    // debug('checkClone', checkClone);

    await workers.performCheck(check);
};

// lookup all the checks, get their data, send to validate
workers.gatherAllChecks = async () => {
    debug('---');
    // get all the checks
    const fileNames = _data.list('checks');

    for (const checkId of fileNames) {

        try {
            const check = _data.read('checks', checkId);
            // pass the data to the check validator
            await workers.validateCheckData(check);
        } catch (error) {
            console.error('error in workers:', error);
        }
    }
};

// timer to execute log rotation
workers.logRotationLoop = () => {
    setInterval(() => {
        workers.rotateLogs();
    }, 1000 * 60 * 60 * 24);
};

// rotate (compress) logs files
workers.rotateLogs = () => {
    // list all the non compressed files
    const logs = _logs.list(false);

    for (const logName of logs) {
        // compress
        const logId = logName.replace('.log', '');
        const newLogId = logId + '-' + Date.now();
        try {
            _logs.compress(logId, newLogId);    
        } catch (error) {
            console.error('error compressing the log', error);
        }

        // truncate        
        try {
            _logs.truncate(logId);    
        } catch (error) {
            console.error('error truncating the log', error);   
        }
    }
}; 

workers.log = (check, checkOutcome, state, alertWarranted, lastCheck) => {
    // form the log data
    const logData = {
        check,
        checkOutcome,
        state,
        alertWarranted,
        lastCheck
    };

    // convert data to string
    const logString = JSON.stringify(logData);

    // determinate the name
    const logFileName = check.id;

    _logs.append(logFileName, logString);

};

// timer to execute the worker once per minute
workers.loop = () => {
    setInterval(() => {
        workers.gatherAllChecks();
    }, 1000 * 60);
};

workers.init = () => {
    // send to console in yellow
    console.log('\x1b[33m%s\x1b[0m', 'background workers are running.');

    workers.gatherAllChecks();

    // call a loop to preven the finish
    workers.loop();

    // compress all the logs
    workers.rotateLogs();

    // call the compression
    workers.logRotationLoop();
};

module.exports = workers;