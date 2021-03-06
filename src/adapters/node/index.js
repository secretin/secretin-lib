import crypto from 'crypto';
import forge from 'node-forge';

import {
  asciiToHexString,
  hexStringToAscii,
  bytesToASCIIString,
  asciiToUint8Array,
  hexStringToUint8Array,
  bytesToHexString,
} from '../../lib/utils';

export function getSHA256(str) {
  const hash = crypto.createHash('sha256');
  const data = asciiToUint8Array(str);
  hash.update(data);
  return Promise.resolve(hash.digest('hex'));
}

export function genRSAOAEP() {
  return new Promise((resolve, reject) => {
    forge.pki.rsa.generateKeyPair(4096, 0x10001, (err, keypair) => {
      if (err) {
        reject(err);
      } else {
        resolve(keypair);
      }
    });
  });
}

export function generateWrappingKey() {
  const key = forge.random.getBytesSync(32);
  return Promise.resolve(key);
}

export function encryptAESGCM256(secret, key) {
  const result = {};
  if (typeof key === 'undefined') {
    const newKey = forge.random.getBytesSync(32);
    result.key = newKey;
  } else {
    result.key = key;
  }

  const iv = forge.random.getBytesSync(12);
  result.iv = asciiToHexString(iv);

  const cipher = forge.cipher.createCipher('AES-GCM', result.key);
  cipher.start({
    iv,
    tagLength: 128,
  });
  cipher.update(forge.util.createBuffer(JSON.stringify(secret)));
  cipher.finish();

  const data = asciiToHexString(cipher.output.getBytes());
  const tag = asciiToHexString(cipher.mode.tag.getBytes());
  result.secret = data;
  result.secret += tag;
  return Promise.resolve(result);
}

export function decryptAESGCM256(secretObject, key) {
  const decipher = forge.cipher.createDecipher('AES-GCM', key);
  const secret = hexStringToAscii(secretObject.secret);
  const data = secret.substr(0, secret.length - 16);
  const tag = secret.substr(data.length, 16);
  decipher.start({
    iv: hexStringToAscii(secretObject.iv),
    tag,
  });
  decipher.update(forge.util.createBuffer(data));
  const pass = decipher.finish();
  if (pass) {
    return Promise.resolve(JSON.parse(decipher.output.getBytes()));
  }
  return Promise.reject('AES-GCM decryption error');
}

export function encryptRSAOAEP(secret, publicKey) {
  const encrypted = publicKey.encrypt(JSON.stringify(secret), 'RSA-OAEP', {
    md: forge.md.sha256.create(),
  });
  return Promise.resolve(asciiToHexString(encrypted));
}

export function decryptRSAOAEP(secret, privateKey) {
  const decrypted = privateKey.decrypt(hexStringToAscii(secret), 'RSA-OAEP', {
    md: forge.md.sha256.create(),
  });
  return Promise.resolve(JSON.parse(decrypted));
}

export function wrapRSAOAEP(key, publicKey) {
  const encrypted = publicKey.encrypt(key, 'RSA-OAEP', {
    md: forge.md.sha256.create(),
  });
  return Promise.resolve(asciiToHexString(encrypted));
}

export function sign(datas, key) {
  const pss = forge.pss.create({
    md: forge.md.sha256.create(),
    mgf: forge.mgf.mgf1.create(forge.md.sha256.create()),
    saltLength: 32,
  });

  const md = forge.md.sha256.create();
  md.update(datas, 'utf8');

  const signature = key.sign(md, pss);

  return Promise.resolve(asciiToHexString(signature));
}

export function verify(datas, signature, key) {
  const pss = forge.pss.create({
    md: forge.md.sha256.create(),
    mgf: forge.mgf.mgf1.create(forge.md.sha256.create()),
    saltLength: 32,
  });

  const md = forge.md.sha256.create();
  md.update(datas, 'utf8');

  const valid = key.verify(
    md.digest().getBytes(),
    hexStringToAscii(signature),
    pss
  );
  return Promise.resolve(valid);
}

export function unwrapRSAOAEP(wrappedKeyHex, privateKey) {
  const decrypted = privateKey.decrypt(
    hexStringToAscii(wrappedKeyHex),
    'RSA-OAEP',
    {
      md: forge.md.sha256.create(),
    }
  );
  return Promise.resolve(decrypted);
}

function bigIntToBase64Url(fbin) {
  let hex = fbin.toRadix(16);
  if (hex.length % 2) {
    hex = `0${hex}`;
  }
  const buf = new Buffer(hex, 'hex');
  const b64 = buf.toString('base64');
  const b64Url = b64.replace(/[+]/g, '-').replace(/\//g, '_').replace(/=/g, '');
  return b64Url;
}

export function exportClearKey(key) {
  const e = bigIntToBase64Url(key.e);
  const n = bigIntToBase64Url(key.n);
  const jwk = {
    alg: 'RSA-OAEP-256',
    e,
    ext: true,
    key_ops: ['encrypt', 'wrapKey'],
    kty: 'RSA',
    n,
  };
  return Promise.resolve(jwk);
}

export function convertOAEPToPSS(key) {
  return Promise.resolve(key);
}

export function importPublicKey(jwkPublicKey) {
  const n = new Buffer(jwkPublicKey.n, 'base64');
  const e = new Buffer(jwkPublicKey.e, 'base64');

  const publicKey = forge.pki.setRsaPublicKey(
    new forge.jsbn.BigInteger(n.toString('hex'), 16),
    new forge.jsbn.BigInteger(e.toString('hex'), 16)
  );
  return Promise.resolve(publicKey);
}

export function derivePassword(password, parameters) {
  const result = {};

  let saltBuf;
  let iterations;
  if (typeof parameters === 'undefined') {
    saltBuf = asciiToUint8Array(forge.random.getBytesSync(32));
    const iterationsBuf = forge.random.getBytesSync(1);
    iterations = 100000 + iterationsBuf.charCodeAt(0);
  } else {
    saltBuf = hexStringToUint8Array(parameters.salt);
    if (typeof parameters.iterations === 'undefined') {
      iterations = 10000; // retrocompatibility
    } else {
      iterations = parameters.iterations;
    }
  }

  result.salt = bytesToHexString(saltBuf);
  result.iterations = iterations;

  const derivedKey = crypto.pbkdf2Sync(
    password,
    saltBuf,
    iterations,
    32,
    'sha256'
  );

  result.key = bytesToASCIIString(derivedKey);

  return getSHA256(result.key).then(hash => {
    result.hash = hash;
    return result;
  });
}

export function exportKey(wrappingKey, key) {
  const result = {};

  const iv = forge.random.getBytesSync(16);
  result.iv = asciiToHexString(iv);

  let jwk;

  if (typeof key.d !== 'undefined') {
    const d = bigIntToBase64Url(key.d);
    const dp = bigIntToBase64Url(key.dP);
    const dq = bigIntToBase64Url(key.dQ);
    const e = bigIntToBase64Url(key.e);
    const n = bigIntToBase64Url(key.n);
    const p = bigIntToBase64Url(key.p);
    const q = bigIntToBase64Url(key.q);
    const qi = bigIntToBase64Url(key.qInv);

    jwk = {
      alg: 'RSA-OAEP-256',
      d,
      dp,
      dq,
      e,
      ext: true,
      key_ops: ['decrypt', 'unwrapKey'],
      kty: 'RSA',
      n,
      p,
      q,
      qi,
    };
  } else {
    const b64Key = new Buffer(key, 'binary').toString('base64');
    const b64UrlKey = b64Key
      .replace(/[+]/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '');
    jwk = {
      alg: 'A256CBC',
      ext: true,
      k: b64UrlKey,
      key_ops: ['wrapKey', 'unwrapKey'],
      kty: 'oct',
    };
  }
  const cipher = forge.cipher.createCipher('AES-CBC', wrappingKey);
  cipher.start({
    iv,
  });

  cipher.update(forge.util.createBuffer(JSON.stringify(jwk)));
  cipher.finish();

  result.key = asciiToHexString(cipher.output.getBytes());
  return Promise.resolve(result);
}

export function importPrivateKey(key, privateKeyObject) {
  try {
    const wrappedPrivateKey = hexStringToAscii(privateKeyObject.privateKey);
    const iv = hexStringToAscii(privateKeyObject.iv);

    const decipher = forge.cipher.createDecipher('AES-CBC', key);
    decipher.start({ iv });
    decipher.update(forge.util.createBuffer(wrappedPrivateKey));
    decipher.finish();
    const jwkPrivateKeyString = decipher.output.getBytes();

    const jwkPrivateKey = JSON.parse(jwkPrivateKeyString);

    const n = new Buffer(jwkPrivateKey.n, 'base64');
    const e = new Buffer(jwkPrivateKey.e, 'base64');
    const d = new Buffer(jwkPrivateKey.d, 'base64');
    const p = new Buffer(jwkPrivateKey.p, 'base64');
    const q = new Buffer(jwkPrivateKey.q, 'base64');
    const dP = new Buffer(jwkPrivateKey.dp, 'base64');
    const dQ = new Buffer(jwkPrivateKey.dq, 'base64');
    const qInv = new Buffer(jwkPrivateKey.qi, 'base64');

    const privateKey = forge.pki.setRsaPrivateKey(
      new forge.jsbn.BigInteger(n.toString('hex'), 16),
      new forge.jsbn.BigInteger(e.toString('hex'), 16),
      new forge.jsbn.BigInteger(d.toString('hex'), 16),
      new forge.jsbn.BigInteger(p.toString('hex'), 16),
      new forge.jsbn.BigInteger(q.toString('hex'), 16),
      new forge.jsbn.BigInteger(dP.toString('hex'), 16),
      new forge.jsbn.BigInteger(dQ.toString('hex'), 16),
      new forge.jsbn.BigInteger(qInv.toString('hex'), 16)
    );
    return Promise.resolve(privateKey);
  } catch (e) {
    return Promise.reject('Invalid Password');
  }
}

export function importKey(key, keyObject) {
  try {
    const wrappedKey = hexStringToUint8Array(keyObject.key);
    const iv = hexStringToAscii(keyObject.iv);

    const decipher = forge.cipher.createDecipher('AES-CBC', key);
    decipher.start({ iv });
    decipher.update(forge.util.createBuffer(wrappedKey));
    decipher.finish();

    const jwkKeyString = decipher.output.getBytes();

    const jwkKey = JSON.parse(jwkKeyString);

    const importedKey = new Buffer(jwkKey.k, 'base64');

    return Promise.resolve(importedKey.toString('binary'));
  } catch (e) {
    return Promise.reject('Invalid Password');
  }
}
