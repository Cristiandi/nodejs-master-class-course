/*
*   frontend logic for the application
*
*/

const app = {};


// config
app.config = {
    sessionToken: undefined
};

// AJAX client
app.client = {};

// interface for making api call
app.client.request = (headers, path, method, queryStringObject, payload) => {
    console.log(typeof headers);
    if (headers && typeof headers !== 'object') {
        throw new Error(`app.client.request | headers ${headers} is invalid.`);
    }

    if (typeof path !== 'string' || !path) {
        throw new Error(`app.client.request | path ${path} is invalid.`);
    }

    if (typeof method !== 'string' || !method) {
        throw new Error(`app.client.request | method ${method} is invalid.`);
    }

    if (!['POST', 'GET', 'PUT', 'DELETE'].includes(method)) {
        throw new Error(`app.client.request | method ${method} is invalid.`);
    }

    if (queryStringObject && typeof queryStringObject !== 'object') {
        throw new Error(`app.client.request | queryStringObject ${queryStringObject} is invalid.`);
    }

    if (payload && typeof payload !== 'object') {
        throw new Error(`app.client.request | payload ${payload} is invalid.`);
    }

    // adding query string params
    const concatQueryParams = Object.keys(queryStringObject | {}).map(key => queryStringObject[key]).join('&');

    let requestUrl = Object.keys(queryStringObject | {}).length ? `${path}?${concatQueryParams}` : path;

    const xhr = new XMLHttpRequest();

    xhr.open(method, requestUrl, true);

    // adding headers
    xhr.setRequestHeader('Content-Type', 'application/json');

    for (const key in headers) {
        if (Object.hasOwnProperty.call(headers, key)) {
            const element = headers[key];
            xhr.setRequestHeader(key, element);
        }
    }

    if (app.config.sessionToken) {
        xhr.setRequestHeader('token', app.config.sessionToken.id);
    }

    // send the payload
    const payloadString = JSON.stringify(payload);

    console.log('payloadString', payloadString);

    xhr.send(payloadString);

    return new Promise((resolve, reject) => {
        // when response
        xhr.onreadystatechange = (ev) => {
            if (xhr.readyState === XMLHttpRequest.DONE) {
                const statusCode = xhr.status;
                const responseReturned = xhr.responseText;

                try {
                    const parsedResponse = JSON.parse(responseReturned);

                    if (!statusCode.toString().startsWith('2')) {
                        return reject({
                            statusCode,
                            data: parsedResponse
                        });
                    }

                    return resolve({
                        statusCode,
                        data: parsedResponse
                    });
                } catch (error) {
                    return reject(error);
                }
            }
        };
    });
};

app.bindForms = function () {
    document.querySelector("form").addEventListener("submit", function (e) {

        // Stop it from submitting
        e.preventDefault();
        const formId = this.id;
        const path = this.action;
        const method = this.method.toUpperCase();

        // Hide the error message (if it's currently shown due to a previous error)
        document.querySelector("#" + formId + " .formError").style.display = 'hidden';

        // Turn the inputs into a payload
        const payload = {};
        const elements = this.elements;
        for (let i = 0; i < elements.length; i++) {
            if (elements[i].type !== 'submit') {
                const valueOfElement = elements[i].type == 'checkbox' ? elements[i].checked : elements[i].value;
                payload[elements[i].name] = valueOfElement;
            }
        }

        // Call the API

        app.client.request(undefined, path, method, undefined, payload)
            .then(({ statusCode, data }) => {
                // successful, send to form response processor
                app.formResponseProcessor(formId, payload, data);
            })
            .catch(error => {
                // Try to get the error from the api, or set a default error message
                let errorMessage;
                if (error.statusCode && error.data) {
                    errorMessage = typeof error.data.message === 'string' ? error.data.message : 'An error has occured, please try again';
                } else {
                    errorMessage = typeof error === 'string' ? error : 'An error has occured, please try again';
                }

                // Set the formError field with the error text
                document.querySelector("#" + formId + " .formError").innerHTML = errorMessage;

                // Show (unhide) the form error field on the form
                document.querySelector("#" + formId + " .formError").style.display = 'block';
            });
    });
};

// Form response processor
app.formResponseProcessor = function (formId, requestPayload, responsePayload) {
    var functionToCall = false;
    if (formId == 'accountCreate') {
        // @TODO Do something here now that the account has been created successfully
        console.log('the account created form was good!');
    }
};

// Init (bootstrapping)
app.init = function () {
    // Bind all form submissions
    app.bindForms();
};

// Call the init processes after the window loads
window.onload = function () {
    app.init();
};