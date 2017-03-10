(function (exports,crypto$1,forge) {
'use strict';

crypto$1 = 'default' in crypto$1 ? crypto$1['default'] : crypto$1;
forge = 'default' in forge ? forge['default'] : forge;

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
  return String.fromCharCode.apply(null, new Uint8Array(bytes));
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
  asciiToHexString: asciiToHexString,
  hexStringToAscii: hexStringToAscii
};

function getSHA256(str) {
  var hash = crypto$1.createHash('sha256');
  var data = asciiToUint8Array(str);
  hash.update(data);
  return Promise.resolve(hash.digest('hex'));
}

function genRSAOAEP() {
  return new Promise(function (resolve, reject) {
    forge.pki.rsa.generateKeyPair(4096, 0x10001, function (err, keypair) {
      if (err) {
        reject(err);
      } else {
        resolve(keypair);
      }
    });
  });
}

function generateWrappingKey() {
  var key = forge.random.getBytesSync(32);
  return Promise.resolve(key);
}

function encryptAESGCM256(secret, key) {
  var result = {};
  if (typeof key === 'undefined') {
    var newKey = forge.random.getBytesSync(32);
    result.key = newKey;
  } else {
    result.key = key;
  }

  var iv = forge.random.getBytesSync(12);
  result.iv = asciiToHexString(iv);

  var cipher = forge.cipher.createCipher('AES-GCM', result.key);
  cipher.start({
    iv: iv,
    tagLength: 128
  });
  cipher.update(forge.util.createBuffer(JSON.stringify(secret)));
  cipher.finish();

  var data = asciiToHexString(cipher.output.getBytes());
  var tag = asciiToHexString(cipher.mode.tag.getBytes());
  result.secret = data;
  result.secret += tag;
  return Promise.resolve(result);
}

function decryptAESGCM256(secretObject, key) {
  var decipher = forge.cipher.createDecipher('AES-GCM', key);
  var secret = hexStringToAscii(secretObject.secret);
  var data = secret.substr(0, secret.length - 16);
  var tag = secret.substr(data.length, 16);
  decipher.start({
    iv: hexStringToAscii(secretObject.iv),
    tag: tag
  });
  decipher.update(forge.util.createBuffer(data));
  var pass = decipher.finish();
  if (pass) {
    return Promise.resolve(JSON.parse(decipher.output.getBytes()));
  }
  return Promise.reject('AES-GCM decryption error');
}

function encryptRSAOAEP(secret, publicKey) {
  var encrypted = publicKey.encrypt(JSON.stringify(secret), 'RSA-OAEP', {
    md: forge.md.sha256.create()
  });
  return Promise.resolve(asciiToHexString(encrypted));
}

function decryptRSAOAEP(secret, privateKey) {
  var decrypted = privateKey.decrypt(hexStringToAscii(secret), 'RSA-OAEP', {
    md: forge.md.sha256.create()
  });
  return Promise.resolve(JSON.parse(decrypted));
}

function wrapRSAOAEP(key, publicKey) {
  var encrypted = publicKey.encrypt(key, 'RSA-OAEP', {
    md: forge.md.sha256.create()
  });
  return Promise.resolve(asciiToHexString(encrypted));
}

function sign(datas, key) {
  var pss = forge.pss.create({
    md: forge.md.sha256.create(),
    mgf: forge.mgf.mgf1.create(forge.md.sha256.create()),
    saltLength: 32
  });

  var md = forge.md.sha256.create();
  md.update(datas, 'utf8');

  var signature = key.sign(md, pss);

  return Promise.resolve(asciiToHexString(signature));
}

function verify(datas, signature, key) {
  var pss = forge.pss.create({
    md: forge.md.sha256.create(),
    mgf: forge.mgf.mgf1.create(forge.md.sha256.create()),
    saltLength: 32
  });

  var md = forge.md.sha256.create();
  md.update(datas, 'utf8');

  var valid = key.verify(md.digest().getBytes(), hexStringToAscii(signature), pss);
  return Promise.resolve(valid);
}

function unwrapRSAOAEP(wrappedKeyHex, privateKey) {
  var decrypted = privateKey.decrypt(hexStringToAscii(wrappedKeyHex), 'RSA-OAEP', {
    md: forge.md.sha256.create()
  });
  return Promise.resolve(decrypted);
}

function bigIntToBase64Url(fbin) {
  var hex = fbin.toRadix(16);
  if (hex.length % 2) {
    hex = '0' + hex;
  }
  var buf = new Buffer(hex, 'hex');
  var b64 = buf.toString('base64');
  var b64Url = b64.replace(/[+]/g, '-').replace(/\//g, '_').replace(/=/g, '');
  return b64Url;
}

function exportClearKey(key) {
  var e = bigIntToBase64Url(key.e);
  var n = bigIntToBase64Url(key.n);
  var jwk = {
    alg: 'RSA-OAEP-256',
    e: e,
    ext: true,
    key_ops: ['encrypt', 'wrapKey'],
    kty: 'RSA',
    n: n
  };
  return Promise.resolve(jwk);
}

function convertOAEPToPSS(key) {
  return Promise.resolve(key);
}

function importPublicKey(jwkPublicKey) {
  var n = new Buffer(jwkPublicKey.n, 'base64');
  var e = new Buffer(jwkPublicKey.e, 'base64');

  var publicKey = forge.pki.setRsaPublicKey(new forge.jsbn.BigInteger(n.toString('hex'), 16), new forge.jsbn.BigInteger(e.toString('hex'), 16));
  return Promise.resolve(publicKey);
}

function derivePassword(password, parameters) {
  var result = {};

  var saltBuf = void 0;
  var iterations = void 0;
  if (typeof parameters === 'undefined') {
    saltBuf = asciiToUint8Array(forge.random.getBytesSync(32));
    var iterationsBuf = forge.random.getBytesSync(1);
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

  var derivedKey = crypto$1.pbkdf2Sync(password, saltBuf, iterations, 32, 'sha256');

  result.key = bytesToASCIIString(derivedKey);

  return getSHA256(result.key).then(function (hash) {
    result.hash = hash;
    return result;
  });
}

function exportKey(wrappingKey, key) {
  var result = {};

  var iv = forge.random.getBytesSync(16);
  result.iv = asciiToHexString(iv);

  var jwk = void 0;

  if (typeof key.d !== 'undefined') {
    var d = bigIntToBase64Url(key.d);
    var dp = bigIntToBase64Url(key.dP);
    var dq = bigIntToBase64Url(key.dQ);
    var e = bigIntToBase64Url(key.e);
    var n = bigIntToBase64Url(key.n);
    var p = bigIntToBase64Url(key.p);
    var q = bigIntToBase64Url(key.q);
    var qi = bigIntToBase64Url(key.qInv);

    jwk = {
      alg: 'RSA-OAEP-256',
      d: d,
      dp: dp,
      dq: dq,
      e: e,
      ext: true,
      key_ops: ['decrypt', 'unwrapKey'],
      kty: 'RSA',
      n: n,
      p: p,
      q: q,
      qi: qi
    };
  } else {
    var b64Key = new Buffer(key, 'binary').toString('base64');
    var b64UrlKey = b64Key.replace(/[+]/g, '-').replace(/\//g, '_').replace(/=/g, '');
    jwk = {
      alg: 'A256CBC',
      ext: true,
      k: b64UrlKey,
      key_ops: ['wrapKey', 'unwrapKey'],
      kty: 'oct'
    };
  }
  var cipher = forge.cipher.createCipher('AES-CBC', wrappingKey);
  cipher.start({
    iv: iv
  });

  cipher.update(forge.util.createBuffer(JSON.stringify(jwk)));
  cipher.finish();

  result.key = asciiToHexString(cipher.output.getBytes());
  return Promise.resolve(result);
}

function importPrivateKey(key, privateKeyObject) {
  try {
    var wrappedPrivateKey = hexStringToAscii(privateKeyObject.privateKey);
    var iv = hexStringToAscii(privateKeyObject.iv);

    var decipher = forge.cipher.createDecipher('AES-CBC', key);
    decipher.start({ iv: iv });
    decipher.update(forge.util.createBuffer(wrappedPrivateKey));
    decipher.finish();
    var jwkPrivateKeyString = decipher.output.getBytes();

    var jwkPrivateKey = JSON.parse(jwkPrivateKeyString);

    var n = new Buffer(jwkPrivateKey.n, 'base64');
    var e = new Buffer(jwkPrivateKey.e, 'base64');
    var d = new Buffer(jwkPrivateKey.d, 'base64');
    var p = new Buffer(jwkPrivateKey.p, 'base64');
    var q = new Buffer(jwkPrivateKey.q, 'base64');
    var dP = new Buffer(jwkPrivateKey.dp, 'base64');
    var dQ = new Buffer(jwkPrivateKey.dq, 'base64');
    var qInv = new Buffer(jwkPrivateKey.qi, 'base64');

    var privateKey = forge.pki.setRsaPrivateKey(new forge.jsbn.BigInteger(n.toString('hex'), 16), new forge.jsbn.BigInteger(e.toString('hex'), 16), new forge.jsbn.BigInteger(d.toString('hex'), 16), new forge.jsbn.BigInteger(p.toString('hex'), 16), new forge.jsbn.BigInteger(q.toString('hex'), 16), new forge.jsbn.BigInteger(dP.toString('hex'), 16), new forge.jsbn.BigInteger(dQ.toString('hex'), 16), new forge.jsbn.BigInteger(qInv.toString('hex'), 16));
    return Promise.resolve(privateKey);
  } catch (e) {
    return Promise.reject('Invalid Password');
  }
}

function importKey(key, keyObject) {
  try {
    var wrappedKey = hexStringToUint8Array(keyObject.key);
    var iv = hexStringToAscii(keyObject.iv);

    var decipher = forge.cipher.createDecipher('AES-CBC', key);
    decipher.start({ iv: iv });
    decipher.update(forge.util.createBuffer(wrappedKey));
    decipher.finish();

    var jwkKeyString = decipher.output.getBytes();

    var jwkKey = JSON.parse(jwkKeyString);

    var importedKey = new Buffer(jwkKey.k, 'base64');

    return Promise.resolve(importedKey.toString('binary'));
  } catch (e) {
    return Promise.reject('Invalid Password');
  }
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

}((this.SecretinNodeAdapter = this.SecretinNodeAdapter || {}),crypto,forge));