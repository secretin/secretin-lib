(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports, require('crypto'), require('node-forge')) :
  typeof define === 'function' && define.amd ? define(['exports', 'crypto', 'node-forge'], factory) :
  (global = typeof globalThis !== 'undefined' ? globalThis : global || self, factory(global.SecretinNodeAdapter = {}, global.crypto, global.forge));
})(this, (function (exports, crypto, forge) { 'use strict';

  function _interopDefaultLegacy (e) { return e && typeof e === 'object' && 'default' in e ? e : { 'default': e }; }

  var crypto__default = /*#__PURE__*/_interopDefaultLegacy(crypto);
  var forge__default = /*#__PURE__*/_interopDefaultLegacy(forge);

  function hexStringToUint8Array(hexString) {
    if (hexString.length % 2 !== 0) {
      throw 'Invalid hexString';
    }
    const arrayBuffer = new Uint8Array(hexString.length / 2);

    for (let i = 0; i < hexString.length; i += 2) {
      const byteValue = parseInt(hexString.substr(i, 2), 16);
      if (isNaN(byteValue)) {
        throw 'Invalid hexString';
      }
      arrayBuffer[i / 2] = byteValue;
    }

    return arrayBuffer;
  }

  function bytesToHexString(givenBytes) {
    if (!givenBytes) {
      return null;
    }

    const bytes = new Uint8Array(givenBytes);
    const hexBytes = [];

    for (let i = 0; i < bytes.length; ++i) {
      let byteString = bytes[i].toString(16);
      if (byteString.length < 2) {
        byteString = `0${byteString}`;
      }
      hexBytes.push(byteString);
    }
    return hexBytes.join('');
  }

  function asciiToUint8Array(str) {
    const chars = [];
    for (let i = 0; i < str.length; ++i) {
      chars.push(str.charCodeAt(i));
    }
    return new Uint8Array(chars);
  }

  function asciiToHexString(str) {
    return str
      .split('')
      .map((c) => `0${c.charCodeAt(0).toString(16)}`.slice(-2))
      .join('');
  }

  function hexStringToAscii(hexx) {
    const hex = hexx.toString();
    let str = '';
    for (let i = 0; i < hex.length; i += 2) {
      str += String.fromCharCode(parseInt(hex.substr(i, 2), 16));
    }
    return str;
  }

  function bytesToASCIIString(bytes) {
    // String.fromCharCode.apply(null, new Uint8Array(bytes)) trigger Maximum call stack size exceeded
    const array = new Uint8Array(bytes);
    return array.reduce(
      (str, charIndex) => str + String.fromCharCode(charIndex),
      ''
    );
  }

  function getSHA256(str) {
    const hash = crypto__default["default"].createHash('sha256');
    const data = asciiToUint8Array(str);
    hash.update(data);
    return Promise.resolve(hash.digest('hex'));
  }

  function genRSAOAEP() {
    return new Promise((resolve, reject) => {
      forge__default["default"].pki.rsa.generateKeyPair(4096, 0x10001, (err, keypair) => {
        if (err) {
          reject(err);
        } else {
          resolve(keypair);
        }
      });
    });
  }

  function generateWrappingKey() {
    const key = forge__default["default"].random.getBytesSync(32);
    return Promise.resolve(key);
  }

  function encryptAESGCM256(secret, key) {
    const result = {};
    if (typeof key === 'undefined') {
      const newKey = forge__default["default"].random.getBytesSync(32);
      result.key = newKey;
    } else {
      result.key = key;
    }

    const iv = forge__default["default"].random.getBytesSync(12);
    result.iv = asciiToHexString(iv);

    const cipher = forge__default["default"].cipher.createCipher('AES-GCM', result.key);
    cipher.start({
      iv,
      tagLength: 128,
    });
    cipher.update(forge__default["default"].util.createBuffer(JSON.stringify(secret)));
    cipher.finish();

    const data = asciiToHexString(cipher.output.getBytes());
    const tag = asciiToHexString(cipher.mode.tag.getBytes());
    result.secret = data;
    result.secret += tag;
    return Promise.resolve(result);
  }

  function decryptAESGCM256(secretObject, key) {
    const decipher = forge__default["default"].cipher.createDecipher('AES-GCM', key);
    const secret = hexStringToAscii(secretObject.secret);
    const data = secret.substr(0, secret.length - 16);
    const tag = secret.substr(data.length, 16);
    decipher.start({
      iv: hexStringToAscii(secretObject.iv),
      tag,
    });
    decipher.update(forge__default["default"].util.createBuffer(data));
    const pass = decipher.finish();
    if (pass) {
      return Promise.resolve(JSON.parse(decipher.output.getBytes()));
    }
    return Promise.reject('AES-GCM decryption error');
  }

  function encryptRSAOAEP(secret, publicKey) {
    const encrypted = publicKey.encrypt(JSON.stringify(secret), 'RSA-OAEP', {
      md: forge__default["default"].md.sha256.create(),
    });
    return Promise.resolve(asciiToHexString(encrypted));
  }

  function decryptRSAOAEP(secret, privateKey) {
    const decrypted = privateKey.decrypt(hexStringToAscii(secret), 'RSA-OAEP', {
      md: forge__default["default"].md.sha256.create(),
    });
    return Promise.resolve(JSON.parse(decrypted));
  }

  function wrapRSAOAEP(key, publicKey) {
    const encrypted = publicKey.encrypt(key, 'RSA-OAEP', {
      md: forge__default["default"].md.sha256.create(),
    });
    return Promise.resolve(asciiToHexString(encrypted));
  }

  function sign(datas, key) {
    const pss = forge__default["default"].pss.create({
      md: forge__default["default"].md.sha256.create(),
      mgf: forge__default["default"].mgf.mgf1.create(forge__default["default"].md.sha256.create()),
      saltLength: 32,
    });

    const md = forge__default["default"].md.sha256.create();
    md.update(datas, 'utf8');

    const signature = key.sign(md, pss);

    return Promise.resolve(asciiToHexString(signature));
  }

  function verify(datas, signature, key) {
    const pss = forge__default["default"].pss.create({
      md: forge__default["default"].md.sha256.create(),
      mgf: forge__default["default"].mgf.mgf1.create(forge__default["default"].md.sha256.create()),
      saltLength: 32,
    });

    const md = forge__default["default"].md.sha256.create();
    md.update(datas, 'utf8');

    const valid = key.verify(
      md.digest().getBytes(),
      hexStringToAscii(signature),
      pss
    );
    return Promise.resolve(valid);
  }

  function unwrapRSAOAEP(wrappedKeyHex, privateKey) {
    const decrypted = privateKey.decrypt(
      hexStringToAscii(wrappedKeyHex),
      'RSA-OAEP',
      {
        md: forge__default["default"].md.sha256.create(),
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

  function exportClearKey(key) {
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

  function convertOAEPToPSS(key) {
    return Promise.resolve(key);
  }

  function importPublicKey(jwkPublicKey) {
    const n = new Buffer(jwkPublicKey.n, 'base64');
    const e = new Buffer(jwkPublicKey.e, 'base64');

    const publicKey = forge__default["default"].pki.setRsaPublicKey(
      new forge__default["default"].jsbn.BigInteger(n.toString('hex'), 16),
      new forge__default["default"].jsbn.BigInteger(e.toString('hex'), 16)
    );
    return Promise.resolve(publicKey);
  }

  function derivePassword(password, parameters) {
    const result = {};

    let saltBuf;
    let iterations;
    if (typeof parameters === 'undefined') {
      saltBuf = asciiToUint8Array(forge__default["default"].random.getBytesSync(32));
      const iterationsBuf = forge__default["default"].random.getBytesSync(1);
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

    const derivedKey = crypto__default["default"].pbkdf2Sync(
      password,
      saltBuf,
      iterations,
      32,
      'sha256'
    );

    result.key = bytesToASCIIString(derivedKey);

    return getSHA256(result.key).then((hash) => {
      result.hash = hash;
      return result;
    });
  }

  function exportKey(wrappingKey, key) {
    const result = {};

    const iv = forge__default["default"].random.getBytesSync(16);
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
    const cipher = forge__default["default"].cipher.createCipher('AES-CBC', wrappingKey);
    cipher.start({
      iv,
    });

    cipher.update(forge__default["default"].util.createBuffer(JSON.stringify(jwk)));
    cipher.finish();

    result.key = asciiToHexString(cipher.output.getBytes());
    return Promise.resolve(result);
  }

  function importPrivateKey(key, privateKeyObject) {
    try {
      const wrappedPrivateKey = hexStringToAscii(privateKeyObject.privateKey);
      const iv = hexStringToAscii(privateKeyObject.iv);

      const decipher = forge__default["default"].cipher.createDecipher('AES-CBC', key);
      decipher.start({ iv });
      decipher.update(forge__default["default"].util.createBuffer(wrappedPrivateKey));
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

      const privateKey = forge__default["default"].pki.setRsaPrivateKey(
        new forge__default["default"].jsbn.BigInteger(n.toString('hex'), 16),
        new forge__default["default"].jsbn.BigInteger(e.toString('hex'), 16),
        new forge__default["default"].jsbn.BigInteger(d.toString('hex'), 16),
        new forge__default["default"].jsbn.BigInteger(p.toString('hex'), 16),
        new forge__default["default"].jsbn.BigInteger(q.toString('hex'), 16),
        new forge__default["default"].jsbn.BigInteger(dP.toString('hex'), 16),
        new forge__default["default"].jsbn.BigInteger(dQ.toString('hex'), 16),
        new forge__default["default"].jsbn.BigInteger(qInv.toString('hex'), 16)
      );
      return Promise.resolve(privateKey);
    } catch (e) {
      return Promise.reject('Invalid Password');
    }
  }

  function importKey(key, keyObject) {
    try {
      const wrappedKey = hexStringToUint8Array(keyObject.key);
      const iv = hexStringToAscii(keyObject.iv);

      const decipher = forge__default["default"].cipher.createDecipher('AES-CBC', key);
      decipher.start({ iv });
      decipher.update(forge__default["default"].util.createBuffer(wrappedKey));
      decipher.finish();

      const jwkKeyString = decipher.output.getBytes();

      const jwkKey = JSON.parse(jwkKeyString);

      const importedKey = new Buffer(jwkKey.k, 'base64');

      return Promise.resolve(importedKey.toString('binary'));
    } catch (e) {
      return Promise.reject('Invalid Password');
    }
  }

  exports.convertOAEPToPSS = convertOAEPToPSS;
  exports.decryptAESGCM256 = decryptAESGCM256;
  exports.decryptRSAOAEP = decryptRSAOAEP;
  exports.derivePassword = derivePassword;
  exports.encryptAESGCM256 = encryptAESGCM256;
  exports.encryptRSAOAEP = encryptRSAOAEP;
  exports.exportClearKey = exportClearKey;
  exports.exportKey = exportKey;
  exports.genRSAOAEP = genRSAOAEP;
  exports.generateWrappingKey = generateWrappingKey;
  exports.getSHA256 = getSHA256;
  exports.importKey = importKey;
  exports.importPrivateKey = importPrivateKey;
  exports.importPublicKey = importPublicKey;
  exports.sign = sign;
  exports.unwrapRSAOAEP = unwrapRSAOAEP;
  exports.verify = verify;
  exports.wrapRSAOAEP = wrapRSAOAEP;

  Object.defineProperty(exports, '__esModule', { value: true });

}));
