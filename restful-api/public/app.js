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

    // console.log('queryStringObject', queryStringObject);

    // adding query string params
    const keys = Object.keys(queryStringObject || {});

    let concatQueryParams = keys.map(key => `${key}=${queryStringObject[key]}`);

    concatQueryParams = concatQueryParams.length > 1 ? concatQueryParams.join('&') : concatQueryParams[0];

    // console.log('concatQueryParams', concatQueryParams);

    let requestUrl = keys.length ? `${path}?${concatQueryParams}` : path;

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

// Bind the logout button
app.bindLogoutButton = function () {
    document.getElementById("logoutButton").addEventListener("click", function (e) {

        // Stop it from redirecting anywhere
        e.preventDefault();

        // Log the user out
        app.logUserOut();

    });
};

// Log the user out then redirect them
app.logUserOut = async function () {
    // Get the current token id
    const tokenId = typeof (app.config.sessionToken.id) == 'string' ? app.config.sessionToken.id : undefined;

    // Send the current token to the tokens endpoint to delete it
    const queryStringObject = {
        id: tokenId
    };

    await app.client.request(undefined, 'api/tokens', 'DELETE', queryStringObject, undefined);

    // Set the app.config token as false
    app.setSessionToken(undefined);

    // Send the user to the logged out page
    window.location = '/session/deleted';
};

app.bindForms = function () {
    if (!document.querySelector("form")) return;


    const allForms = document.querySelectorAll("form");

    for (let i = 0; i < allForms.length; i++) {
        allForms[i].addEventListener("submit", function (e) {

            // Stop it from submitting
            e.preventDefault();
            const formId = this.id;
            const path = this.action;

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

            const method = payload?._method?.toUpperCase() || this.method.toUpperCase();

            // Call the API

            console.log('path', path);
            console.log('method', method);
            console.log('payload', payload);

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
    }
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

    // If forms saved successfully and they have success messages, show them
    const formsWithSuccessMessages = ['accountEdit1', 'accountEdit2'];
    if (formsWithSuccessMessages.includes(formId)) {
        document.querySelector("#" + formId + " .formSuccess").style.display = 'block';
    }
};

// Get the session token from localstorage and set it in the app.config object
app.getSessionToken = function () {
    const tokenString = localStorage.getItem('token');

    // console.log('tokenString', tokenString);

    if (typeof (tokenString) == 'string') {
        try {
            const token = JSON.parse(tokenString);
            app.config.sessionToken = token;
            if (typeof (token) == 'object') {
                console.log('logged!');
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
    if (typeof token === 'object') {
        console.log('logged');
        app.setLoggedInClass(true);
    } else {
        app.setLoggedInClass(false);
    }
};

// Renew the token
app.renewToken = async function () {
    const currentToken = typeof app.config.sessionToken == 'object' ? app.config.sessionToken : undefined;

    if (!currentToken) {
        app.setSessionToken(undefined);
        throw new Error(`can't get the current token.`);
    }

    // Update the token with a new expiration
    const payload = {
        id: currentToken.id,
        extend: true,
    };

    try {
        await app.client.request(undefined, 'api/tokens', 'PUT', undefined, payload);

        const queryStringObject = { id: currentToken.id };

        const responsePayload = await app.client.request(undefined, 'api/tokens', 'GET', queryStringObject, undefined);

        app.setSessionToken(responsePayload.data);
    } catch (error) {
        console.error(error);
        app.setSessionToken(undefined);
        throw error;
    }
};

// Load the account edit page specifically
app.loadAccountEditPage = async () => {
    // Get the phone number from the current token, or log the user out if none is there
    const phone = typeof (app?.config?.sessionToken?.userPhone) == 'string' ? app.config.sessionToken.userPhone : undefined;

    if (!phone) {
        app.logUserOut();

        return;
    }

    const queryStringObject = {
        phone
    };

    const responsePayload = await app.client.request(undefined, 'api/users', 'GET', queryStringObject, undefined);

    const { statusCode = 500 } = responsePayload;

    if (statusCode !== 200) {
        // If the request comes back as something other than 200, log the user our (on the assumption that the api is temporarily down or the users token is bad)
        app.logUserOut();
        return;
    }

    // Put the data into the forms as values where needed
    document.querySelector("#accountEdit1 .firstNameInput").value = responsePayload?.data?.firstName;
    document.querySelector("#accountEdit1 .lastNameInput").value = responsePayload?.data?.lastName;
    document.querySelector("#accountEdit1 .displayPhoneInput").value = responsePayload?.data?.phone;

    // Put the hidden phone field into both forms
    const hiddenPhoneInputs = document.querySelectorAll("input.hiddenPhoneNumberInput");
    for (let i = 0; i < hiddenPhoneInputs.length; i++) {
        hiddenPhoneInputs[i].value = responsePayload?.data?.phone;
    }
};


// Load data on the page
app.loadDataOnPage = () => {
    // Get the current page from the body class
    const bodyClasses = document.querySelector("body").classList;
    const primaryClass = typeof bodyClasses[0] == 'string' ? bodyClasses[0] : undefined;

    // Logic for account settings page
    if (primaryClass == 'accountEdit') {
        app.loadAccountEditPage();
    }
};

// Loop to renew token often
app.tokenRenewalLoop = function () {
    setInterval(function () {
        app.renewToken()
            .then(() => console.log("Token renewed successfully @ " + Date.now()))
            .catch(err => console.log('error in renewToken', err));
    }, 1000 * 60);
};

// Init (bootstrapping)
app.init = function () {

    // Bind all form submissions
    app.bindForms();

    // Bind logout logout button
    app.bindLogoutButton();

    // Get the token from localstorage
    app.getSessionToken();

    // Renew token
    app.tokenRenewalLoop();

    // load data on page
    app.loadDataOnPage();

};

// Call the init processes after the window loads
window.onload = function () {
    app.init();
};