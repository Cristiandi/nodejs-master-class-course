// UDP server
const dgram = require('dgram');

// creating a UDP server
const server = dgram.createSocket('udp4');

server.on('message', (msg, rinfo) => {
  const message = msg.toString();
  console.log(`received ${message} from ${rinfo.address}:${rinfo.port}`);
});

// bind to port 6000
server.bind(6000);