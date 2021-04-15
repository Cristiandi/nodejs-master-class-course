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

    // console.log('payloadString', payloadString);

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
    if (!document.querySelector("form")) return;

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

        // console.log('path', path);
        // console.log('method', method);
        // console.log('payload', payload);

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
    let functionToCall;
    if (formId == 'accountCreate') {
        // Take the phone and password, and use it to log the user in
        const newPayload = {
            'phone': requestPayload.phone,
            'password': requestPayload.password
        };

        app.client.request(undefined, 'api/tokens', 'POST', undefined, newPayload)
            .then(({ statusCode, data }) => {
                // If successful, set the token and redirect the user
                app.setSessionToken(data);
                window.location = '/checks/all';
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
    }

    // If login was successful, set the token in localstorage and redirect the user
    if (formId == 'sessionCreate') {
        app.setSessionToken(responsePayload);
        window.location = '/checks/all';
    }
};

// Get the session token from localstorage and set it in the app.config object
app.getSessionToken = function () {
    const tokenString = localStorage.getItem('token');
    if (typeof (tokenString) == 'string') {
        try {
            const token = JSON.parse(tokenString);
            app.config.sessionToken = token;
            if (typeof (token) == 'object') {
                app.setLoggedInClass(true);
            } else {
                app.setLoggedInClass(false);
            }
        } catch (e) {
            app.config.sessionToken = false;
            app.setLoggedInClass(false);
        }
    }
};

// Set (or remove) the loggedIn class from the body
app.setLoggedInClass = function (add) {
    const target = document.querySelector("body");
    if (add) {
        target.classList.add('loggedIn');
    } else {
        target.classList.remove('loggedIn');
    }
};

// Set the session token in the app.config object as well as localstorage
app.setSessionToken = function (token) {
    app.config.sessionToken = token;
    const tokenString = JSON.stringify(token);
    localStorage.setItem('token', tokenString);
    if (typeof (token) == 'object') {
        app.setLoggedInClass(true);
    } else {
        app.setLoggedInClass(false);
    }
};

// Renew the token
app.renewToken = async function () {
    const currentToken = typeof (app.config.sessionToken) == 'object' ? app.config.sessionToken : undefined;

    if (!currentToken) {
        app.setSessionToken(false);
        throw new Error(`can't get the current token.`);
    }

    // Update the token with a new expiration
    const payload = {
        id: currentToken.id,
        extend: true,
    };

    try {
        await app.client(undefined, 'api/tokens', 'PUT', undefined, payload);

        const queryStringObject = { id: currentToken.id };

        const responsePayload = await app.client.request(undefined, 'api/tokens', 'GET', queryStringObject, undefined);

        app.setSessionToken(responsePayload.data);
    } catch (error) {
        console.err(error);
        app.setSessionToken(undefined);
        throw error;
    }
};

// Loop to renew token often
app.tokenRenewalLoop = function () {
    setInterval(function () {
        app.renewToken()
            .then(() => console.log("Token renewed successfully @ " + Date.now()))
            .catch(err => console.error('error in renewToken', err));
    }, 1000 * 60);
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