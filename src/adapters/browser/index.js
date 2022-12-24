import {
  asciiToUint8Array,
  hexStringToUint8Array,
  bytesToHexString,
  bytesToASCIIString,
} from '../../lib/utils';

export function getSHA256(str) {
  const algorithm = 'SHA-256';
  const data = asciiToUint8Array(str);
  return crypto.subtle
    .digest(algorithm, data)
    .then((hashedStr) => bytesToHexString(hashedStr));
}

export function genRSAOAEP() {
  const algorithm = {
    name: 'RSA-OAEP',
    modulusLength: 4096,
    publicExponent: new Uint8Array([0x01, 0x00, 0x01]),
    hash: { name: 'SHA-256' },
  };
  const extractable = true;
  const keyUsages = ['wrapKey', 'unwrapKey', 'encrypt', 'decrypt'];
  return crypto.subtle.generateKey(algorithm, extractable, keyUsages);
}

export function genRSAPSS() {
  const algorithm = {
    name: 'RSA-PSS',
    modulusLength: 4096,
    publicExponent: new Uint8Array([0x01, 0x00, 0x01]),
    hash: { name: 'SHA-256' },
  };
  const extractable = true;
  const keyUsages = ['sign', 'verify'];
  return crypto.subtle.generateKey(algorithm, extractable, keyUsages);
}

export function generateWrappingKey() {
  const algorithm = {
    name: 'AES-CBC',
    length: 256,
  };

  const extractable = true;
  const keyUsages = ['wrapKey', 'unwrapKey'];

  return crypto.subtle.generateKey(algorithm, extractable, keyUsages);
}

export function encryptAESGCM256(secret, key) {
  const result = {};
  let algorithm = {};
  const data = asciiToUint8Array(JSON.stringify(secret));
  if (typeof key === 'undefined') {
    algorithm = {
      name: 'AES-GCM',
      length: 256,
    };
    const extractable = true;
    const keyUsages = ['encrypt'];
    return crypto.subtle
      .generateKey(algorithm, extractable, keyUsages)
      .then((newKey) => {
        const iv = new Uint8Array(12);
        crypto.getRandomValues(iv);
        algorithm = {
          name: 'AES-GCM',
          iv,
          tagLength: 128,
        };

        result.key = newKey;
        result.iv = bytesToHexString(iv);
        return crypto.subtle.encrypt(algorithm, newKey, data);
      })
      .then((encryptedSecret) => {
        result.secret = bytesToHexString(encryptedSecret);
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
  result.iv = bytesToHexString(iv);
  return crypto.subtle.encrypt(algorithm, key, data).then((encryptedSecret) => {
    result.secret = bytesToHexString(encryptedSecret);
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
  return crypto.subtle.decrypt(algorithm, key, data).then((decryptedSecret) => {
    const jsonStr = bytesToASCIIString(decryptedSecret);
    // eslint-disable-next-line no-control-regex
    const breakingPattern = /[\x01-\x09\x0B-\x0C\x0E-\x1F]+/gi;
    return JSON.parse(jsonStr.replace(breakingPattern, ''));
  });
}

export function encryptRSAOAEP(secret, publicKey) {
  const algorithm = {
    name: 'RSA-OAEP',
    hash: { name: 'SHA-256' },
  };
  const data = asciiToUint8Array(JSON.stringify(secret));
  return crypto.subtle
    .encrypt(algorithm, publicKey, data)
    .then((encryptedSecret) => bytesToHexString(encryptedSecret));
}

export function decryptRSAOAEP(secret, privateKey) {
  const algorithm = {
    name: 'RSA-OAEP',
    hash: { name: 'SHA-256' },
  };
  const data = hexStringToUint8Array(secret);
  return crypto.subtle
    .decrypt(algorithm, privateKey, data)
    .then((decryptedSecret) => JSON.parse(bytesToASCIIString(decryptedSecret)));
}

export function wrapRSAOAEP(key, wrappingPublicKey) {
  const format = 'raw';
  const wrapAlgorithm = {
    name: 'RSA-OAEP',
    hash: { name: 'SHA-256' },
  };
  return crypto.subtle
    .wrapKey(format, key, wrappingPublicKey, wrapAlgorithm)
    .then((wrappedKey) => bytesToHexString(wrappedKey));
}

export function sign(datas, key) {
  const signAlgorithm = {
    name: 'RSA-PSS',
    saltLength: 32, // In byte
  };
  return crypto.subtle
    .sign(signAlgorithm, key, asciiToUint8Array(datas))
    .then((signature) => bytesToHexString(signature));
}

export function verify(datas, signature, key) {
  const signAlgorithm = {
    name: 'RSA-PSS',
    saltLength: 32, // In byte
  };
  return crypto.subtle.verify(
    signAlgorithm,
    key,
    hexStringToUint8Array(signature),
    asciiToUint8Array(datas)
  );
}

export function unwrapRSAOAEP(
  wrappedKeyHex,
  unwrappingPrivateKey,
  unwrappedKeyAlgorithm = {
    name: 'AES-GCM',
    length: 256,
  }
) {
  const format = 'raw';
  const wrappedKey = hexStringToUint8Array(wrappedKeyHex);
  const unwrapAlgorithm = {
    name: 'RSA-OAEP',
    hash: { name: 'SHA-256' },
  };

  const extractable = true;
  const usages = ['decrypt', 'encrypt', 'wrapKey', 'unwrapKey'];

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

export function exportClearKey(key) {
  const format = 'jwk';
  return crypto.subtle.exportKey(format, key);
}

export function convertOAEPToPSS(key, keyUsage) {
  return exportClearKey(key).then((OAEPKey) => {
    const format = 'jwk';
    const algorithm = {
      name: 'RSA-PSS',
      hash: { name: 'SHA-256' },
    };
    const extractable = false;
    const keyUsages = [keyUsage];

    const PSSKey = OAEPKey;
    PSSKey.alg = 'PS256';
    PSSKey.key_ops = keyUsages;

    return crypto.subtle.importKey(
      format,
      PSSKey,
      algorithm,
      extractable,
      keyUsages
    );
  });
}

export function importPublicKey(jwkPublicKey) {
  const format = 'jwk';
  const algorithm = {
    name: 'RSA-OAEP',
    hash: { name: 'SHA-256' },
  };
  const extractable = true;
  const keyUsages = ['wrapKey', 'encrypt'];
  return crypto.subtle.importKey(
    format,
    jwkPublicKey,
    algorithm,
    extractable,
    keyUsages
  );
}

export function importPublicKeySign(jwkPublicKey) {
  const format = 'jwk';
  const algorithm = {
    name: 'RSA-PSS',
    hash: { name: 'SHA-256' },
  };
  const extractable = true;
  const keyUsages = ['verify'];
  return crypto.subtle.importKey(
    format,
    jwkPublicKey,
    algorithm,
    extractable,
    keyUsages
  );
}

export function derivePassword(password, parameters) {
  const result = {};

  const passwordBuf = asciiToUint8Array(password);
  let extractable = false;
  let usages = ['deriveKey', 'deriveBits'];

  return crypto.subtle
    .importKey('raw', passwordBuf, { name: 'PBKDF2' }, extractable, usages)
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

      result.salt = bytesToHexString(saltBuf);
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

      return crypto.subtle.deriveKey(
        algorithm,
        key,
        deriveKeyAlgorithm,
        extractable,
        usages
      );
    })
    .then((dKey) => {
      result.key = dKey;
      return crypto.subtle.exportKey('raw', dKey);
    })
    .then((rawKey) => crypto.subtle.digest('SHA-256', rawKey))
    .then((hashedKey) => {
      result.hash = bytesToHexString(hashedKey);
      return result;
    });
}

export function exportKey(wrappingKey, key) {
  const result = {};
  const format = 'jwk';
  const iv = new Uint8Array(16);
  crypto.getRandomValues(iv);
  const wrapAlgorithm = {
    name: 'AES-CBC',
    iv,
  };
  result.iv = bytesToHexString(iv);
  return crypto.subtle
    .wrapKey(format, key, wrappingKey, wrapAlgorithm)
    .then((wrappedKey) => {
      result.key = bytesToHexString(wrappedKey);
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
    format,
    wrappedPrivateKey,
    key,
    unwrapAlgorithm,
    unwrappedKeyAlgorithm,
    extractable,
    keyUsages
  );
}

export function importPrivateKeySign(key, privateKeyObject) {
  const format = 'jwk';
  const wrappedPrivateKey = hexStringToUint8Array(privateKeyObject.privateKey);
  const unwrapAlgorithm = {
    name: 'AES-CBC',
    iv: hexStringToUint8Array(privateKeyObject.iv),
  };
  const unwrappedKeyAlgorithm = {
    name: 'RSA-PSS',
    hash: { name: 'sha-256' },
  };
  const extractable = true;
  const keyUsages = ['sign'];

  return crypto.subtle.unwrapKey(
    format,
    wrappedPrivateKey,
    key,
    unwrapAlgorithm,
    unwrappedKeyAlgorithm,
    extractable,
    keyUsages
  );
}

export function importKey(key, keyObject) {
  const format = 'jwk';
  const wrappedKey = hexStringToUint8Array(keyObject.key);
  const unwrapAlgorithm = {
    name: 'AES-CBC',
    iv: hexStringToUint8Array(keyObject.iv),
  };
  const unwrappedKeyAlgorithm = unwrapAlgorithm;
  const extractable = true;
  const keyUsages = ['wrapKey', 'unwrapKey'];

  return crypto.subtle.unwrapKey(
    format,
    wrappedKey,
    key,
    unwrapAlgorithm,
    unwrappedKeyAlgorithm,
    extractable,
    keyUsages
  );
}

export function randomUUID() {
  return crypto.randomUUID();
}

const SecretinBrowserAdapter = {
  convertOAEPToPSS,
  decryptAESGCM256,
  decryptRSAOAEP,
  derivePassword,
  encryptAESGCM256,
  encryptRSAOAEP,
  exportClearKey,
  exportKey,
  generateWrappingKey,
  genRSAOAEP,
  genRSAPSS,
  getSHA256,
  importKey,
  importPrivateKey,
  importPrivateKeySign,
  importPublicKey,
  importPublicKeySign,
  sign,
  unwrapRSAOAEP,
  verify,
  wrapRSAOAEP,
  randomUUID,
};

export default SecretinBrowserAdapter;
