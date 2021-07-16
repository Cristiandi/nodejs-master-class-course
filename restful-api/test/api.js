// API tests

// Dependecies
const assert = require('assert');
const http = require('http');

const app = require('../index');
const config = require('../lib/config');

const api = {};

const hepelrs = {};

hepelrs.makeGetRequest = function (path, callback) {
    const requestDetails = {
        prtocol: 'http',
        hostname: 'localhost',
        port: config.httpPort,
        method: 'GET',
        path,
        headers: {
            'Content-Type': 'application/json',
        }
    };

    const req = http.request(requestDetails, (res) => {
        callback(res);
    });

    req.end();
};

api['app.init should start without throwing'] = function (done) {
    assert.doesNotThrow(function () {
        app.init(function (err) {
            done();
        });
    }, TypeError);
};

api['/ping should respond to GET with 200'] = function (done) {
    hepelrs.makeGetRequest('/ping', function (res) {
        assert.strictEqual(res.statusCode, 200);
        done();
    });
};

api['/users should respond to GET with 400'] = function (done) {    
    hepelrs.makeGetRequest('/api/users', function (res) {
        assert.strictEqual(res.statusCode, 400);  
        done();
    });

    // assert.strictEqual(1, 2);
    // assert.strictEqual(res.statusCode, 400);
    // done();
};

api['a random should respond to GET with 404'] = function (done) {
    hepelrs.makeGetRequest('/this/path', function (res) {
        assert.strictEqual(res.statusCode, 404);
        done();
    });
};

module.exports = api;