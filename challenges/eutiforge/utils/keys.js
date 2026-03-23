const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const keysDir = path.join(__dirname, '..', 'keys');

function generateKeys() {
  if (!fs.existsSync(keysDir)) {
    fs.mkdirSync(keysDir, { recursive: true });
  }

  const privatePath = path.join(keysDir, 'private.pem');
  const publicPath = path.join(keysDir, 'public.pem');

  if (fs.existsSync(privatePath) && fs.existsSync(publicPath)) {
    return;
  }

  const { publicKey, privateKey } = crypto.generateKeyPairSync('rsa', {
    modulusLength: 2048,
    publicKeyEncoding: { type: 'spki', format: 'pem' },
    privateKeyEncoding: { type: 'pkcs8', format: 'pem' }
  });

  fs.writeFileSync(privatePath, privateKey);
  fs.writeFileSync(publicPath, publicKey);
  console.log('[+] RSA key pair generated');
}

function getPrivateKey() {
  return fs.readFileSync(path.join(keysDir, 'private.pem'), 'utf8');
}

function getPublicKey() {
  return fs.readFileSync(path.join(keysDir, 'public.pem'), 'utf8');
}

module.exports = { generateKeys, getPrivateKey, getPublicKey };
