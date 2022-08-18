require('dotenv').config()
var http = require('http');

const req = http.request({
  hostname: 'localhost',
  port: 3001,
  path: '/api/websites/stream/admin_panel',
  method: 'POST',
  headers: {
    'Content-Type': 'multipart/form-data',
    'x-websites-secret-token': process.env.WEBSITES_TOKEN,
    "Transfer-Encoding": "chunked"
  }
},
  (res) => {
    console.log(`STATUS: ${res.statusCode}`);
    res.setEncoding('utf8');
    res.on('data', (chunk) => {
      console.log(`BODY: ${chunk}`);
    });
    res.on('end', () => {
      console.log('No more data in response.');
    });
  })


module.exports = {
  startLogging: () => {
    process.stdout.write('Starting logging\n')
    const originalStdoutWrite = process.stdout.write.bind(process.stdout);
    const originalStderrWrite = process.stderr.write.bind(process.stderr);

    process.stdout.write = (chunk, encoding, callback) => {
      req.write(chunk, encoding, callback)
      return originalStdoutWrite(chunk, encoding, callback);
    };
    process.stderr.write = (chunk, encoding, callback) => {
      req.write(chunk, encoding, callback)
      return originalStderrWrite(chunk, encoding, callback);
    };
  }
}