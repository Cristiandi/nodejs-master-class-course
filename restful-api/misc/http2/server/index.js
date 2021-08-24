// http2 server

// dependencies
const http2 = require('http2');

// init the server
const server = http2.createServer();

// on a stream, send back hello world html
server.on('stream', (stream, headers) => {
  stream.respond({
    'content-type': 'text/html',
    ':status': 200
  });
  stream.end('<h1>Hello World</h1>');
});

// listen on port 6000
server.listen(6000);