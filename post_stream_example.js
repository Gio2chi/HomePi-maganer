require('dotenv').config();
var http = require('http');
const fs = require('fs');
const path = require('path');

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
}, (res) => {
    console.log(`STATUS: ${res.statusCode}`);
    res.setEncoding('utf8');
    res.on('data', (chunk) => {
      console.log(`BODY: ${chunk}`);
    });
    res.on('end', () => {
      console.log('No more data in response.');
    });
  })

let readable = fs.createReadStream(path.join('C:\\Users\\gioan\\Desktop\\apps\\minecraft\\forge-1.16.3-34.1.42-installer.jar.log'))
readable.on('end', () => {
  req.end()
})
readable.pipe(req)