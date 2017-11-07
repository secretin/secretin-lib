(function (exports) {
'use strict';

var asyncGenerator = function () {
  function AwaitValue(value) {
    this.value = value;
  }

  function AsyncGenerator(gen) {
    var front, back;

    function send(key, arg) {
      return new Promise(function (resolve, reject) {
        var request = {
          key: key,
          arg: arg,
          resolve: resolve,
          reject: reject,
          next: null
        };

        if (back) {
          back = back.next = request;
        } else {
          front = back = request;
          resume(key, arg);
        }
      });
    }

    function resume(key, arg) {
      try {
        var result = gen[key](arg);
        var value = result.value;

        if (value instanceof AwaitValue) {
          Promise.resolve(value.value).then(function (arg) {
            resume("next", arg);
          }, function (arg) {
            resume("throw", arg);
          });
        } else {
          settle(result.done ? "return" : "normal", result.value);
        }
      } catch (err) {
        settle("throw", err);
      }
    }

    function settle(type, value) {
      switch (type) {
        case "return":
          front.resolve({
            value: value,
            done: true
          });
          break;

        case "throw":
          front.reject(value);
          break;

        default:
          front.resolve({
            value: value,
            done: false
          });
          break;
      }

      front = front.next;

      if (front) {
        resume(front.key, front.arg);
      } else {
        back = null;
      }
    }

    this._invoke = send;

    if (typeof gen.return !== "function") {
      this.return = undefined;
    }
  }

  if (typeof Symbol === "function" && Symbol.asyncIterator) {
    AsyncGenerator.prototype[Symbol.asyncIterator] = function () {
      return this;
    };
  }

  AsyncGenerator.prototype.next = function (arg) {
    return this._invoke("next", arg);
  };

  AsyncGenerator.prototype.throw = function (arg) {
    return this._invoke("throw", arg);
  };

  AsyncGenerator.prototype.return = function (arg) {
    return this._invoke("return", arg);
  };

  return {
    wrap: function (fn) {
      return function () {
        return new AsyncGenerator(fn.apply(this, arguments));
      };
    },
    await: function (value) {
      return new AwaitValue(value);
    }
  };
}();

var toConsumableArray = function (arr) {
  if (Array.isArray(arr)) {
    for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) arr2[i] = arr[i];

    return arr2;
  } else {
    return Array.from(arr);
  }
};

var symbols = '!@#$%^&*()+_=}{[]|:;"?.><,`~';
var vowels = 'aeiouy';
var consonants = 'bcdfghjklmnpqrstvwxz';
var numbers = '0123456789';

var similarChars = '[ilLI|`oO0';

var hasNumber = function hasNumber(str) {
  return str.match(/\d+/g) != null;
};
var hasMixedCase = function hasMixedCase(str) {
  return str.toUpperCase() !== str && str.toLowerCase() !== str;
};
var hasSymbol = function hasSymbol(str) {
  var regexString = '[' + escapeRegExp(symbols) + ']';
  var symbolRegex = new RegExp(regexString);
  return str.match(symbolRegex) != null;
};

var checkStrictRules = function checkStrictRules(str, rules) {
  return rules.numbers === hasNumber(str) && rules.mixedCase === hasMixedCase(str) && rules.symbols === hasSymbol(str);
};

var buildCharset = function buildCharset(options) {
  var charset = [];

  var letters = vowels + consonants;

  charset.push.apply(charset, [].concat(toConsumableArray(letters)));

  if (options.contentRules.mixedCase) {
    charset.push.apply(charset, [].concat(toConsumableArray(letters.toUpperCase())));
  }
  if (options.contentRules.numbers) {
    charset.push.apply(charset, [].concat(toConsumableArray(numbers)));
  }
  if (options.contentRules.symbols) {
    charset.push.apply(charset, [].concat(toConsumableArray(symbols)));
  }

  if (options.contentRules.similarChars === false) {
    charset.filter(function (character) {
      return similarChars.indexOf(character) >= 0;
    });
  }

  return charset;
};

var getRandomPassword = function getRandomPassword(options) {
  var password = '';

  if (options.readable) {
    var lastCharWasVocal = false; // TODO : rand

    for (var i = 0; i < options.length; i += 1) {
      var charset = lastCharWasVocal ? consonants : vowels;
      lastCharWasVocal = !lastCharWasVocal;
      var randomIndex = generateRandomNumber(charset.length);
      password += charset[randomIndex];
    }
  } else {
    var _charset = buildCharset(options);

    for (var _i = 0; _i < options.length; _i += 1) {
      var _randomIndex = generateRandomNumber(_charset.length);
      password += _charset[_randomIndex];
    }
  }

  return password;
};

var generatePassword = function generatePassword(customOptions) {
  var defaults = {
    length: 20,
    readable: false,
    allowSimilarChars: false,
    strictRules: true,
    contentRules: {
      numbers: true,
      mixedCase: true,
      symbols: true
    }
  };

  var options = Object.assign({}, defaults, customOptions);
  var contentRules = options.contentRules;

  var password = getRandomPassword(options);

  if (options.strictRules) {
    return checkStrictRules(password, contentRules) ? password : generatePassword(customOptions);
  }

  return password;
};

var PasswordGenerator = {
  hasNumber: hasNumber,
  hasMixedCase: hasMixedCase,
  hasSymbol: hasSymbol,
  checkStrictRules: checkStrictRules,
  buildCharset: buildCharset,
  getRandomPassword: getRandomPassword,
  generatePassword: generatePassword
};

function hexStringToUint8Array(hexString) {
  if (hexString.length % 2 !== 0) {
    throw 'Invalid hexString';
  }
  var arrayBuffer = new Uint8Array(hexString.length / 2);

  for (var i = 0; i < hexString.length; i += 2) {
    var byteValue = parseInt(hexString.substr(i, 2), 16);
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

  var bytes = new Uint8Array(givenBytes);
  var hexBytes = [];

  for (var i = 0; i < bytes.length; ++i) {
    var byteString = bytes[i].toString(16);
    if (byteString.length < 2) {
      byteString = '0' + byteString;
    }
    hexBytes.push(byteString);
  }
  return hexBytes.join('');
}

function asciiToUint8Array(str) {
  var chars = [];
  for (var i = 0; i < str.length; ++i) {
    chars.push(str.charCodeAt(i));
  }
  return new Uint8Array(chars);
}

function asciiToHexString(str) {
  return str.split('').map(function (c) {
    return ('0' + c.charCodeAt(0).toString(16)).slice(-2);
  }).join('');
}

function hexStringToAscii(hexx) {
  var hex = hexx.toString();
  var str = '';
  for (var i = 0; i < hex.length; i += 2) {
    str += String.fromCharCode(parseInt(hex.substr(i, 2), 16));
  }
  return str;
}

function bytesToASCIIString(bytes) {
  // String.fromCharCode.apply(null, new Uint8Array(bytes)) trigger Maximum call stack size exceeded
  var array = new Uint8Array(bytes);
  return array.reduce(function (str, charIndex) {
    return str + String.fromCharCode(charIndex);
  }, '');
}

function generateRandomNumber(max) {
  var randomValues = new Uint8Array(1);
  crypto.getRandomValues(randomValues);
  return randomValues[0] % max;
}

function generateSeed() {
  var buf = new Uint8Array(32);
  crypto.getRandomValues(buf);

  var shift = 3;
  var carry = 0;
  var symbol = void 0;
  var byte = void 0;
  var i = void 0;
  var output = '';
  var alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';

  for (i = 0; i < buf.length; i++) {
    byte = buf[i];

    symbol = carry | byte >> shift;
    output += alphabet[symbol & 0x1f];

    if (shift > 5) {
      shift -= 5;
      symbol = byte >> shift;
      output += alphabet[symbol & 0x1f];
    }

    shift = 5 - shift;
    carry = byte << shift;
    shift = 8 - shift;
  }

  if (shift !== 3) {
    output += alphabet[carry & 0x1f];
    shift = 3;
    carry = 0;
  }

  return { b32: output, raw: buf };
}

function xorSeed(byteArray1, byteArray2) {
  if (byteArray1 instanceof Uint8Array && byteArray2 instanceof Uint8Array && byteArray1.length === 32 && byteArray2.length === 32) {
    var buf = new Uint8Array(32);
    var i = void 0;
    for (i = 0; i < 32; i++) {
      buf[i] = byteArray1[i] ^ byteArray2[i];
    }
    return bytesToHexString(buf);
  }
  throw 'Utils.xorSeed expect 32 bytes Uint8Arrays';
}

function escapeRegExp(s) {
  return s.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&');
}

function defaultProgress(status) {
  var seconds = Math.trunc(Date.now());
  if (status.total < 2) {
    // eslint-disable-next-line no-console
    console.log(seconds + ' : ' + status.message);
  } else {
    // eslint-disable-next-line no-console
    console.log(seconds + ' : ' + status.message + ' (' + status.state + '/' + status.total + ')');
  }
}

var Utils = {
  generateRandomNumber: generateRandomNumber,
  generateSeed: generateSeed,
  hexStringToUint8Array: hexStringToUint8Array,
  bytesToHexString: bytesToHexString,
  asciiToUint8Array: asciiToUint8Array,
  bytesToASCIIString: bytesToASCIIString,
  xorSeed: xorSeed,
  escapeRegExp: escapeRegExp,
  PasswordGenerator: PasswordGenerator,
  defaultProgress: defaultProgress,
  asciiToHexString: asciiToHexString,
  hexStringToAscii: hexStringToAscii
};

function getSHA256(str) {
  var algorithm = 'SHA-256';
  var data = asciiToUint8Array(str);
  return crypto.subtle.digest(algorithm, data).then(function (hashedStr) {
    return bytesToHexString(hashedStr);
  });
}

function genRSAOAEP() {
  var algorithm = {
    name: 'RSA-OAEP',
    modulusLength: 4096,
    publicExponent: new Uint8Array([0x01, 0x00, 0x01]),
    hash: { name: 'SHA-256' }
  };
  var extractable = true;
  var keyUsages = ['wrapKey', 'unwrapKey', 'encrypt', 'decrypt'];
  return crypto.subtle.generateKey(algorithm, extractable, keyUsages);
}

function generateWrappingKey() {
  var algorithm = {
    name: 'AES-CBC',
    length: 256
  };

  var extractable = true;
  var keyUsages = ['wrapKey', 'unwrapKey'];

  return crypto.subtle.generateKey(algorithm, extractable, keyUsages);
}

function encryptAESGCM256(secret, key) {
  var result = {};
  var algorithm = {};
  if (typeof key === 'undefined') {
    algorithm = {
      name: 'AES-GCM',
      length: 256
    };
    var extractable = true;
    var keyUsages = ['encrypt'];
    return crypto.subtle.generateKey(algorithm, extractable, keyUsages).then(function (newKey) {
      var iv = new Uint8Array(12);
      crypto.getRandomValues(iv);
      algorithm = {
        name: 'AES-GCM',
        iv: iv,
        tagLength: 128
      };
      var data = asciiToUint8Array(JSON.stringify(secret));
      result.key = newKey;
      result.iv = bytesToHexString(iv);
      return crypto.subtle.encrypt(algorithm, newKey, data);
    }).then(function (encryptedSecret) {
      result.secret = bytesToHexString(encryptedSecret);
      return result;
    });
  }

  result.key = key;
  var iv = new Uint8Array(12);
  crypto.getRandomValues(iv);
  algorithm = {
    name: 'AES-GCM',
    iv: iv,
    tagLength: 128
  };
  var data = asciiToUint8Array(JSON.stringify(secret));
  result.iv = bytesToHexString(iv);
  return crypto.subtle.encrypt(algorithm, key, data).then(function (encryptedSecret) {
    result.secret = bytesToHexString(encryptedSecret);
    return result;
  });
}

function decryptAESGCM256(secretObject, key) {
  var algorithm = {
    name: 'AES-GCM',
    iv: hexStringToUint8Array(secretObject.iv),
    tagLength: 128
  };
  var data = hexStringToUint8Array(secretObject.secret);
  return crypto.subtle.decrypt(algorithm, key, data).then(function (decryptedSecret) {
    return JSON.parse(bytesToASCIIString(decryptedSecret));
  });
}

function encryptRSAOAEP(secret, publicKey) {
  var algorithm = {
    name: 'RSA-OAEP',
    hash: { name: 'SHA-256' }
  };
  var data = asciiToUint8Array(JSON.stringify(secret));
  return crypto.subtle.encrypt(algorithm, publicKey, data).then(function (encryptedSecret) {
    return bytesToHexString(encryptedSecret);
  });
}

function decryptRSAOAEP(secret, privateKey) {
  var algorithm = {
    name: 'RSA-OAEP',
    hash: { name: 'SHA-256' }
  };
  var data = hexStringToUint8Array(secret);
  return crypto.subtle.decrypt(algorithm, privateKey, data).then(function (decryptedSecret) {
    return JSON.parse(bytesToASCIIString(decryptedSecret));
  });
}

function wrapRSAOAEP(key, wrappingPublicKey) {
  var format = 'raw';
  var wrapAlgorithm = {
    name: 'RSA-OAEP',
    hash: { name: 'SHA-256' }
  };
  return crypto.subtle.wrapKey(format, key, wrappingPublicKey, wrapAlgorithm).then(function (wrappedKey) {
    return bytesToHexString(wrappedKey);
  });
}

function sign(datas, key) {
  var signAlgorithm = {
    name: 'RSA-PSS',
    saltLength: 32 };
  return crypto.subtle.sign(signAlgorithm, key, asciiToUint8Array(datas)).then(function (signature) {
    return bytesToHexString(signature);
  });
}

function verify(datas, signature, key) {
  var signAlgorithm = {
    name: 'RSA-PSS',
    saltLength: 32 };
  return crypto.subtle.verify(signAlgorithm, key, hexStringToUint8Array(signature), asciiToUint8Array(datas));
}

function unwrapRSAOAEP(wrappedKeyHex, unwrappingPrivateKey) {
  var format = 'raw';
  var wrappedKey = hexStringToUint8Array(wrappedKeyHex);
  var unwrapAlgorithm = {
    name: 'RSA-OAEP',
    hash: { name: 'SHA-256' }
  };
  var unwrappedKeyAlgorithm = {
    name: 'AES-GCM',
    length: 256
  };
  var extractable = true;
  var usages = ['decrypt', 'encrypt'];

  return crypto.subtle.unwrapKey(format, wrappedKey, unwrappingPrivateKey, unwrapAlgorithm, unwrappedKeyAlgorithm, extractable, usages);
}

function exportClearKey(key) {
  var format = 'jwk';
  return crypto.subtle.exportKey(format, key);
}

function convertOAEPToPSS(key, keyUsage) {
  return exportClearKey(key).then(function (OAEPKey) {
    var format = 'jwk';
    var algorithm = {
      name: 'RSA-PSS',
      hash: { name: 'SHA-256' }
    };
    var extractable = false;
    var keyUsages = [keyUsage];

    var PSSKey = OAEPKey;
    PSSKey.alg = 'PS256';
    PSSKey.key_ops = keyUsages;

    return crypto.subtle.importKey(format, PSSKey, algorithm, extractable, keyUsages);
  });
}

function importPublicKey(jwkPublicKey) {
  var format = 'jwk';
  var algorithm = {
    name: 'RSA-OAEP',
    hash: { name: 'SHA-256' }
  };
  var extractable = true;
  var keyUsages = ['wrapKey', 'encrypt'];
  return crypto.subtle.importKey(format, jwkPublicKey, algorithm, extractable, keyUsages);
}

function derivePassword(password, parameters) {
  var result = {};

  var passwordBuf = asciiToUint8Array(password);
  var extractable = false;
  var usages = ['deriveKey', 'deriveBits'];

  return crypto.subtle.importKey('raw', passwordBuf, { name: 'PBKDF2' }, extractable, usages).then(function (key) {
    var saltBuf = void 0;
    var iterations = void 0;
    if (typeof parameters === 'undefined') {
      saltBuf = new Uint8Array(32);
      crypto.getRandomValues(saltBuf);
      var iterationsBuf = new Uint8Array(1);
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

    var algorithm = {
      name: 'PBKDF2',
      salt: saltBuf,
      iterations: iterations,
      hash: { name: 'SHA-256' }
    };

    var deriveKeyAlgorithm = {
      name: 'AES-CBC',
      length: 256
    };

    extractable = true;
    usages = ['wrapKey', 'unwrapKey'];

    return crypto.subtle.deriveKey(algorithm, key, deriveKeyAlgorithm, extractable, usages);
  }).then(function (dKey) {
    result.key = dKey;
    return crypto.subtle.exportKey('raw', dKey);
  }).then(function (rawKey) {
    return crypto.subtle.digest('SHA-256', rawKey);
  }).then(function (hashedKey) {
    result.hash = bytesToHexString(hashedKey);
    return result;
  });
}

function exportKey(wrappingKey, key) {
  var result = {};
  var format = 'jwk';
  var iv = new Uint8Array(16);
  crypto.getRandomValues(iv);
  var wrapAlgorithm = {
    name: 'AES-CBC',
    iv: iv
  };
  result.iv = bytesToHexString(iv);
  return crypto.subtle.wrapKey(format, key, wrappingKey, wrapAlgorithm).then(function (wrappedKey) {
    result.key = bytesToHexString(wrappedKey);
    return result;
  });
}

function importPrivateKey(key, privateKeyObject) {
  var format = 'jwk';
  var wrappedPrivateKey = hexStringToUint8Array(privateKeyObject.privateKey);
  var unwrapAlgorithm = {
    name: 'AES-CBC',
    iv: hexStringToUint8Array(privateKeyObject.iv)
  };
  var unwrappedKeyAlgorithm = {
    name: 'RSA-OAEP',
    hash: { name: 'sha-256' }
  };
  var extractable = true;
  var keyUsages = ['unwrapKey', 'decrypt'];

  return crypto.subtle.unwrapKey(format, wrappedPrivateKey, key, unwrapAlgorithm, unwrappedKeyAlgorithm, extractable, keyUsages).catch(function () {
    return Promise.reject('Invalid Password');
  });
}

function importKey(key, keyObject) {
  var format = 'jwk';
  var wrappedKey = hexStringToUint8Array(keyObject.key);
  var unwrapAlgorithm = {
    name: 'AES-CBC',
    iv: hexStringToUint8Array(keyObject.iv)
  };
  var unwrappedKeyAlgorithm = unwrapAlgorithm;
  var extractable = true;
  var keyUsages = ['wrapKey', 'unwrapKey'];

  return crypto.subtle.unwrapKey(format, wrappedKey, key, unwrapAlgorithm, unwrappedKeyAlgorithm, extractable, keyUsages).catch(function () {
    return Promise.reject('Invalid Password');
  });
}

exports.getSHA256 = getSHA256;
exports.genRSAOAEP = genRSAOAEP;
exports.generateWrappingKey = generateWrappingKey;
exports.encryptAESGCM256 = encryptAESGCM256;
exports.decryptAESGCM256 = decryptAESGCM256;
exports.encryptRSAOAEP = encryptRSAOAEP;
exports.decryptRSAOAEP = decryptRSAOAEP;
exports.wrapRSAOAEP = wrapRSAOAEP;
exports.sign = sign;
exports.verify = verify;
exports.unwrapRSAOAEP = unwrapRSAOAEP;
exports.exportClearKey = exportClearKey;
exports.convertOAEPToPSS = convertOAEPToPSS;
exports.importPublicKey = importPublicKey;
exports.derivePassword = derivePassword;
exports.exportKey = exportKey;
exports.importPrivateKey = importPrivateKey;
exports.importKey = importKey;

}((this.SecretinBrowserAdapter = this.SecretinBrowserAdapter || {})));