(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports) :
  typeof define === 'function' && define.amd ? define(['exports'], factory) :
  (global = typeof globalThis !== 'undefined' ? globalThis : global || self, factory(global.SecretinBrowserAdapter = {}));
})(this, (function (exports) { 'use strict';

  /* eslint-disable max-classes-per-file */
  class Error {
    constructor(errorObject) {
      this.message = 'Unknown error';
      if (typeof errorObject !== 'undefined') {
        this.errorObject = errorObject;
      } else {
        this.errorObject = null;
      }
    }
  }
  class InvalidHexStringError extends Error {
    constructor() {
      super();
      this.message = 'Invalid hexString';
    }
  }

  class InvalidPasswordError extends Error {
    constructor() {
      super();
      this.message = 'Invalid password';
    }
  }

  /* eslint-disable no-bitwise */

  function hexStringToUint8Array(hexString) {
    if (hexString.length % 2 !== 0) {
      throw new InvalidHexStringError();
    }
    const arrayBuffer = new Uint8Array(hexString.length / 2);

    for (let i = 0; i < hexString.length; i += 2) {
      const byteValue = parseInt(hexString.substr(i, 2), 16);
      if (Number.isNaN(byteValue)) {
        throw new InvalidHexStringError();
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

    for (let i = 0; i < bytes.length; i += 1) {
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
    for (let i = 0; i < str.length; i += 1) {
      chars.push(str.charCodeAt(i));
    }
    return new Uint8Array(chars);
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
    const algorithm = 'SHA-256';
    const data = asciiToUint8Array(str);
    return crypto.subtle
      .digest(algorithm, data)
      .then((hashedStr) => bytesToHexString(hashedStr));
  }

  function genRSAOAEP() {
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

  function generateWrappingKey() {
    const algorithm = {
      name: 'AES-CBC',
      length: 256,
    };

    const extractable = true;
    const keyUsages = ['wrapKey', 'unwrapKey'];

    return crypto.subtle.generateKey(algorithm, extractable, keyUsages);
  }

  function encryptAESGCM256(secret, key) {
    const result = {};
    let algorithm = {};
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
          const data = asciiToUint8Array(JSON.stringify(secret));
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
    const data = asciiToUint8Array(JSON.stringify(secret));
    result.iv = bytesToHexString(iv);
    return crypto.subtle.encrypt(algorithm, key, data).then((encryptedSecret) => {
      result.secret = bytesToHexString(encryptedSecret);
      return result;
    });
  }

  function decryptAESGCM256(secretObject, key) {
    const algorithm = {
      name: 'AES-GCM',
      iv: hexStringToUint8Array(secretObject.iv),
      tagLength: 128,
    };
    const data = hexStringToUint8Array(secretObject.secret);
    return crypto.subtle
      .decrypt(algorithm, key, data)
      .then((decryptedSecret) => JSON.parse(bytesToASCIIString(decryptedSecret)));
  }

  function encryptRSAOAEP(secret, publicKey) {
    const algorithm = {
      name: 'RSA-OAEP',
      hash: { name: 'SHA-256' },
    };
    const data = asciiToUint8Array(JSON.stringify(secret));
    return crypto.subtle
      .encrypt(algorithm, publicKey, data)
      .then((encryptedSecret) => bytesToHexString(encryptedSecret));
  }

  function decryptRSAOAEP(secret, privateKey) {
    const algorithm = {
      name: 'RSA-OAEP',
      hash: { name: 'SHA-256' },
    };
    const data = hexStringToUint8Array(secret);
    return crypto.subtle
      .decrypt(algorithm, privateKey, data)
      .then((decryptedSecret) => JSON.parse(bytesToASCIIString(decryptedSecret)));
  }

  function wrapRSAOAEP(key, wrappingPublicKey) {
    const format = 'raw';
    const wrapAlgorithm = {
      name: 'RSA-OAEP',
      hash: { name: 'SHA-256' },
    };
    return crypto.subtle
      .wrapKey(format, key, wrappingPublicKey, wrapAlgorithm)
      .then((wrappedKey) => bytesToHexString(wrappedKey));
  }

  function sign(datas, key) {
    const signAlgorithm = {
      name: 'RSA-PSS',
      saltLength: 32, // In byte
    };
    return crypto.subtle
      .sign(signAlgorithm, key, asciiToUint8Array(datas))
      .then((signature) => bytesToHexString(signature));
  }

  function verify(datas, signature, key) {
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

  function unwrapRSAOAEP(wrappedKeyHex, unwrappingPrivateKey) {
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

  function exportClearKey(key) {
    const format = 'jwk';
    return crypto.subtle.exportKey(format, key);
  }

  function convertOAEPToPSS(key, keyUsage) {
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

  function importPublicKey(jwkPublicKey) {
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

  function derivePassword(password, parameters) {
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

  function exportKey(wrappingKey, key) {
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

  function importPrivateKey(key, privateKeyObject) {
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

    return crypto.subtle
      .unwrapKey(
        format,
        wrappedPrivateKey,
        key,
        unwrapAlgorithm,
        unwrappedKeyAlgorithm,
        extractable,
        keyUsages
      )
      .catch(() => Promise.reject(new InvalidPasswordError()));
  }

  function importKey(key, keyObject) {
    const format = 'jwk';
    const wrappedKey = hexStringToUint8Array(keyObject.key);
    const unwrapAlgorithm = {
      name: 'AES-CBC',
      iv: hexStringToUint8Array(keyObject.iv),
    };
    const unwrappedKeyAlgorithm = unwrapAlgorithm;
    const extractable = true;
    const keyUsages = ['wrapKey', 'unwrapKey'];

    return crypto.subtle
      .unwrapKey(
        format,
        wrappedKey,
        key,
        unwrapAlgorithm,
        unwrappedKeyAlgorithm,
        extractable,
        keyUsages
      )
      .catch(() => Promise.reject(new InvalidPasswordError()));
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
