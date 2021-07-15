/*
* Unit tests
*/

const assert = require('assert');

const helpers = require('../lib/helpers');
const logs = require('../lib/logs'); 

const exampleProblem = require('../lib/example-problem');

// holder for test units
const unit = {};

// assert that getANumber
unit['helpers.getANumber should return 1'] = function(done) {
    const val = helpers.getANumber();

    assert.strictEqual(val, 1);

    done();
};

unit['helpers.getANumber should return a number'] = function(done) {
    const val = helpers.getANumber();

    assert.strictEqual(typeof val, 'number');

    done();
};

unit['helpers.getANumber should return 2'] = function(done) {
    const val = helpers.getANumber();

    assert.strictEqual(val, 2);

    done();
};

// Logs.list should return an array
unit['logs.list should return an array'] = function(done) {
    try {
        const value = logs.list(true);
        assert.ok(value instanceof Array);
        done();
    } catch (error) {
        assert.strictEqual(error, undefined);
    }
};

unit['logs.truncate should trow is the logId does not exists'] = function(done) {
    try {
        logs.truncate('i do not exists');
    } catch (error) {
        assert.ok(error);
    }

    done();
}

module.exports = unit;