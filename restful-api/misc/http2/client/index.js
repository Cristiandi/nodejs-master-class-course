// http2 client

const http2 = require('http2');

// create a new http2 client
const client = http2.connect('http://localhost:6000');

// create the request
const request = client.request({
    ':path': '/',
});

// when a message is received, add the pieces of it together until the entire message is received
let str = '';
request.on('data', (chunk) => {
    str += chunk;
});

// when the entire message is received, print it
request.on('end', () => {
    console.log(str);
});

// send the request
request.end();