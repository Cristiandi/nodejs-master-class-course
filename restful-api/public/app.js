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