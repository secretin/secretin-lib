import {
  asciiToUint8Array,
  hexStringToUint8Array,
} from './util';


export function getSHA256(str) {
  const algorithm = 'SHA-256';
  const data = asciiToUint8Array(str);
  return crypto.subtle.digest(algorithm, data);
}

export function genRSAOAEP() {
  const algorithm = {
    name: 'RSA-OAEP',
    modulusLength: 4096,
    publicExponent: new Uint8Array([0x01, 0x00, 0x01]),
    hash: { name: 'SHA-256' },
  };
  const extractable = true;
  const keyUsages = [
    'wrapKey',
    'unwrapKey',
    'encrypt',
    'decrypt',
  ];
  return crypto.subtle.generateKey(algorithm, extractable, keyUsages);
}


export function encryptAESGCM256(secret, key) {
  const result = {};
  let algorithm = {};
  if (typeof key === 'undefined') {
    algorithm = {
      name: 'AES-GCM',
      length: 256,
    };
    const extractable = true;
    const keyUsages = [
      'encrypt',
    ];
    return crypto.subtle.generateKey(algorithm, extractable, keyUsages)
      .then((newKey) => {
        const iv = new Uint8Array(12);
        crypto.getRandomValues(iv);
        algorithm = {
          name: 'AES-GCM',
          iv,
          tagLength: 128,
        };
        const data = asciiToUint8Array(JSON.stringify(secret));
        result.key = newKey;
        result.iv = iv;
        return crypto.subtle.encrypt(algorithm, newKey, data);
      })
      .then((encryptedSecret) => {
        result.secret = encryptedSecret;
        return result;
      });
  }

  result.key = key;
  const iv = new Uint8Array(12);
  crypto.getRandomValues(iv);
  algorithm = {
    name: 'AES-GCM',
    iv,
    tagLength: 128,
  };
  const data = asciiToUint8Array(JSON.stringify(secret));
  result.iv = iv;
  return crypto.subtle.encrypt(algorithm, key, data)
    .then((encryptedSecret) => {
      result.secret = encryptedSecret;
      return result;
    });
}

export function decryptAESGCM256(secretObject, key) {
  const algorithm = {
    name: 'AES-GCM',
    iv: hexStringToUint8Array(secretObject.iv),
    tagLength: 128,
  };
  const data = hexStringToUint8Array(secretObject.secret);
  return crypto.subtle.decrypt(algorithm, key, data);
}

export function encryptRSAOAEP(secret, publicKey) {
  const algorithm = {
    name: 'RSA-OAEP',
    hash: { name: 'SHA-256' },
  };
  const data = asciiToUint8Array(secret);
  return crypto.subtle.encrypt(algorithm, publicKey, data);
}

export function decryptRSAOAEP(secret, privateKey) {
  const algorithm = {
    name: 'RSA-OAEP',
    hash: { name: 'SHA-256' },
  };
  const data = hexStringToUint8Array(secret);
  return crypto.subtle.decrypt(algorithm, privateKey, data);
}

export function wrapRSAOAEP(key, wrappingPublicKey) {
  const format = 'raw';
  const wrapAlgorithm = {
    name: 'RSA-OAEP',
    hash: { name: 'SHA-256' },
  };
  return crypto.subtle.wrapKey(format, key, wrappingPublicKey, wrapAlgorithm);
}

export function unwrapRSAOAEP(wrappedKeyHex, unwrappingPrivateKey) {
  const format = 'raw';
  const wrappedKey = hexStringToUint8Array(wrappedKeyHex);
  const unwrapAlgorithm = {
    name: 'RSA-OAEP',
    hash: { name: 'SHA-256' },
  };
  const unwrappedKeyAlgorithm = {
    name: 'AES-GCM',
    length: 256,
  };
  const extractable = true;
  const usages = ['decrypt', 'encrypt'];

  return crypto.subtle.unwrapKey(
    format,
    wrappedKey,
    unwrappingPrivateKey,
    unwrapAlgorithm,
    unwrappedKeyAlgorithm,
    extractable,
    usages
  );
}

export function exportPublicKey(publicKey) {
  const format = 'jwk';
  return crypto.subtle.exportKey(format, publicKey);
}

export function importPublicKey(jwkPublicKey) {
  const format = 'jwk';
  const algorithm = {
    name: 'RSA-OAEP',
    hash: { name: 'SHA-256' },
  };
  const extractable = false;
  const keyUsages = [
    'wrapKey', 'encrypt',
  ];
  return crypto.subtle.importKey(format, jwkPublicKey, algorithm, extractable, keyUsages);
}

export function derivePassword(password, parameters) {
  const result = {};

  const passwordBuf = asciiToUint8Array(password);
  let extractable = false;
  let usages = ['deriveKey', 'deriveBits'];

  return crypto.subtle.importKey(
    'raw', passwordBuf, { name: 'PBKDF2' }, extractable, usages
  )
    .then((key) => {
      let saltBuf;
      let iterations;
      if (typeof parameters === 'undefined') {
        saltBuf = new Uint8Array(32);
        crypto.getRandomValues(saltBuf);
        const iterationsBuf = new Uint8Array(1);
        crypto.getRandomValues(iterationsBuf);
        iterations = 100000 + iterationsBuf[0];
      } else {
        saltBuf = hexStringToUint8Array(parameters.salt);
        if (typeof parameters.iterations === 'undefined') {
          iterations = 10000; // retrocompatibility
        } else {
          iterations = parameters.iterations;
        }
      }

      result.salt = saltBuf;
      result.iterations = iterations;

      const algorithm = {
        name: 'PBKDF2',
        salt: saltBuf,
        iterations,
        hash: { name: 'SHA-256' },
      };

      const deriveKeyAlgorithm = {
        name: 'AES-CBC',
        length: 256,
      };

      extractable = true;
      usages = ['wrapKey', 'unwrapKey'];

      return crypto.subtle.deriveKey(algorithm, key, deriveKeyAlgorithm, extractable, usages);
    })
    .then((dKey) => {
      result.key = dKey;
      return crypto.subtle.exportKey('raw', dKey);
    })
    .then((rawKey) => crypto.subtle.digest('SHA-256', rawKey))
    .then((hashedKey) => {
      result.hash = hashedKey;
      return result;
    });
}

export function exportPrivateKey(key, privateKey) {
  const result = {};
  const format = 'jwk';
  const iv = new Uint8Array(16);
  crypto.getRandomValues(iv);
  const wrapAlgorithm = {
    name: 'AES-CBC',
    iv,
  };
  result.iv = iv;
  return crypto.subtle.wrapKey(format, privateKey, key, wrapAlgorithm)
    .then((wrappedPrivateKey) => {
      result.privateKey = wrappedPrivateKey;
      return result;
    });
}

export function importPrivateKey(key, privateKeyObject) {
  const format = 'jwk';
  const wrappedPrivateKey = hexStringToUint8Array(privateKeyObject.privateKey);
  const unwrapAlgorithm = {
    name: 'AES-CBC',
    iv: hexStringToUint8Array(privateKeyObject.iv),
  };
  const unwrappedKeyAlgorithm = {
    name: 'RSA-OAEP',
    hash: { name: 'sha-256' },
  };
  const extractable = true;
  const keyUsages = ['unwrapKey', 'decrypt'];

  return crypto.subtle.unwrapKey(
    format, wrappedPrivateKey, key, unwrapAlgorithm, unwrappedKeyAlgorithm, extractable, keyUsages
  )
    .then((privateKey) => privateKey)
    .catch(
      () => { throw 'Invalid Password'; }
    );
}
