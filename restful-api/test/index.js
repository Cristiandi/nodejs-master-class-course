// test runner


// application logic for the test runner
_app = {};

// container for the test
_app.tests = {};

_app.tests.unit = require('./unit');


// count all the tests
_app.countTests = () => {
    let count = 0;

    for (const key in _app.tests) {
        if (Object.hasOwnProperty.call(_app.tests, key)) {
            const subTests = _app.tests[key];
            for (const testName in subTests) {
                if (Object.hasOwnProperty.call(subTests, testName)) count += 1;
            }
        }
    }

    return count;
};

// function to produce a test report
_app.produceTestReport = (limit, successes, errors) => {
    console.log('');
    console.log('---BEGIN TEST REPORT---');
    console.log('');
    console.log('total tests', limit);
    console.log('pass', successes);
    console.log('fail', errors.length);
    console.log('');

    if (!errors.length) {
        console.log('---END TEST REPORT---');
        return;
    }

    console.log('---BEGIN ERROR DETAILS---');
    console.log('');

    for (const error of errors) {
        console.log('\x1b[31m%s\x1b[0m', error.name);
        console.log(error.error);
    }

    console.log('');
    console.log('---END ERROR DETAILS---');
};

// run all the test collecting the errors n the successes
_app.runTests = () => {
    let erors = [];
    let successes = 0;
    const limit = _app.countTests();
    let counter = 0;

    for (const key in _app.tests) {
        if (Object.hasOwnProperty.call(_app.tests, key)) {
            const subTests = _app.tests[key];

            for (const testName in subTests) {
                if (Object.hasOwnProperty.call(subTests, testName)) {
                    (() => {
                        const tmpTestName = testName;
                        const testValue = subTests[testName];

                        // call the test
                        try {
                            testValue(() => {
                                console.log('\x1b[32m%s\x1b[0m', tmpTestName);
                                counter += 1;
                                successes += 1;
                                if (counter === limit) {
                                    _app.produceTestReport(limit, successes, erors);
                                }
                            });           
                        } catch (error) {
                            erors.push({
                                name: testName,
                                error,
                            });
                            console.log('\x1b[31m%s\x1b[0m', tmpTestName);
                            counter++;
                            if (counter === limit) {
                                _app.produceTestReport(limit, successes, erors);
                            }
                        }
                    })();
                }
            }
        }
    }
};

_app.runTests();