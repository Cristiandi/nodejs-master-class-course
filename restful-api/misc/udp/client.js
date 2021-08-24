// UDP client
const dgram = require('dgram');

// create the UDP client
const client = dgram.createSocket('udp4');

// define the message to send and put it into a buffer
const message = 'Hello, world!';
const buffer = new Buffer.from(message);

// send the message
client.send(buffer, 6000, 'localhost', function(err, bytes) {
  console.log('Message sent to UDP server: ' + message);
  client.close();
});