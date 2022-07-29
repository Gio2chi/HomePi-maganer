require('dotenv').config();
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const privateKey = fs.readFileSync(path.join(__dirname, './keys/loggingServer.private.pem'), 'utf8');
const publicKey = fs.readFileSync(path.join(__dirname, './keys/loggingServer.public.pem'), 'utf8');

//create privateKey and public key pair
/*const { privateKey, publicKey } = crypto.generateKeyPairSync('rsa', {
   modulusLength: 2048,
   publicKeyEncoding: {
      type: 'spki',
      format: 'pem'
   },
   privateKeyEncoding: {
      type: 'pkcs8',
      format: 'pem',
      cipher: 'aes-256-cbc',
      passphrase: process.env.PWD_SECRET
   }
})*/

const encrypt = (data) => {
   return crypto.publicEncrypt(publicKey, data)
} 
const decrypt = (data) => {
   return crypto.privateDecrypt({key: privateKey, passphrase: process.env.PWD_SECRET}, data)
} 

module.exports = {
   encrypt,
   decrypt,
   publicKey,
   privateKey
};