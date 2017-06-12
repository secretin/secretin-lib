import {
  getSHA256,
  exportKey,
  importKey,
  genRSAOAEP,
  decryptRSAOAEP,
  encryptRSAOAEP,
  exportClearKey,
  convertOAEPToPSS,
  importPublicKey,
  importPrivateKey,
  encryptAESGCM256,
  decryptAESGCM256,
  wrapRSAOAEP,
  unwrapRSAOAEP,
  generateWrappingKey,
  derivePassword,
  sign,
  verify,
} from './lib/crypto';

import { DecryptMetadataStatus } from './Statuses';

import { defaultProgress } from './lib/utils';

import Secretin from './Secretin';

class User {
  constructor(username) {
    this.username = username;
    this.publicKey = null;
    this.publicKeySign = null;
    this.privateKey = null;
    this.privateKeySign = null;
    this.keys = {};
    this.hash = '';
    this.totp = false;
    this.metadatas = {};
    this.options = User.defaultOptions;
  }

  disconnect() {
    delete this.username;
    delete this.publicKey;
    delete this.publicKeySign;
    delete this.privateKey;
    delete this.privateKeySign;
    delete this.metadatas;
    delete this.keys;
    delete this.hash;
    delete this.totp;
    delete this.options;
  }

  sign(datas) {
    return sign(datas, this.privateKeySign);
  }

  verify(datas, signature) {
    return verify(datas, signature, this.publicKeySign);
  }

  generateMasterKey() {
    return genRSAOAEP()
      .then(keyPair => {
        this.publicKey = keyPair.publicKey;
        this.privateKey = keyPair.privateKey;
        return convertOAEPToPSS(this.privateKey, 'sign');
      })
      .then(privateKeySign => {
        this.privateKeySign = privateKeySign;
        return convertOAEPToPSS(this.publicKey, 'verify');
      })
      .then(publicKeySign => {
        this.publicKeySign = publicKeySign;
      });
  }

  exportPublicKey() {
    return exportClearKey(this.publicKey);
  }

  importPublicKey(jwkPublicKey) {
    return importPublicKey(jwkPublicKey)
      .then(publicKey => {
        this.publicKey = publicKey;
        return convertOAEPToPSS(this.publicKey, 'verify');
      })
      .then(publicKeySign => {
        this.publicKeySign = publicKeySign;
      });
  }

  exportPrivateKey(password) {
    const pass = {};
    return derivePassword(password)
      .then(dKey => {
        pass.salt = dKey.salt;
        this.hash = dKey.hash;
        pass.hash = this.hash;
        pass.iterations = dKey.iterations;
        return exportKey(dKey.key, this.privateKey);
      })
      .then(keyObject => ({
        privateKey: {
          privateKey: keyObject.key,
          iv: keyObject.iv,
        },
        pass,
      }));
  }

  importPrivateKey(dKey, privateKeyObject) {
    return importPrivateKey(dKey, privateKeyObject)
      .then(privateKey => {
        this.privateKey = privateKey;
        return convertOAEPToPSS(this.privateKey, 'sign');
      })
      .then(privateKeySign => {
        this.privateKeySign = privateKeySign;
      });
  }

  exportPrivateData(data) {
    const result = {};
    return encryptRSAOAEP(data, this.publicKey)
      .then(encryptedOptions => {
        result.data = encryptedOptions;
        return this.sign(result.data);
      })
      .then(signature => {
        result.signature = signature;
        return result;
      });
  }

  importPrivateData(data, signature) {
    return this.verify(data, signature).then(verified => {
      if (verified) {
        return decryptRSAOAEP(data, this.privateKey);
      }
      return null;
    });
  }

  exportOptions() {
    return this.exportPrivateData(this.options).then(result => ({
      options: result.data,
      signature: result.signature,
    }));
  }

  importOptions(optionsObject) {
    // Retro compatibility
    if (typeof optionsObject === 'undefined') {
      this.options = User.defaultOptions;
      return Promise.resolve(null);
    }
    return this.importPrivateData(
      optionsObject.options,
      optionsObject.signature
    ).then(options => {
      if (options) {
        this.options = options;
      } else {
        this.options = User.defaultOptions;
      }
    });
  }

  shareSecret(friend, wrappedKey, hashedTitle) {
    const result = { hashedTitle };
    return this.unwrapKey(wrappedKey)
      .then(key => this.wrapKey(key, friend.publicKey))
      .then(friendWrappedKey => {
        result.wrappedKey = friendWrappedKey;
        return getSHA256(friend.username);
      })
      .then(hashedUsername => {
        result.friendName = hashedUsername;
        return result;
      });
  }

  editSecret(hashedTitle, secret) {
    const metadatas = this.metadatas[hashedTitle];
    if (typeof metadatas === 'undefined') {
      return Promise.reject("You don't have this secret");
    }
    const now = new Date();
    metadatas.lastModifiedAt = now.toISOString();
    metadatas.lastModifiedBy = this.username;
    const wrappedKey = this.keys[hashedTitle].key;
    const result = {};
    return this.unwrapKey(wrappedKey)
      .then(key => this.encryptSecret(metadatas, secret, key))
      .then(secretObject => {
        result.secret = secretObject.secret;
        result.iv = secretObject.iv;
        result.metadatas = secretObject.metadatas;
        result.iv_meta = secretObject.iv_meta;
        return result;
      });
  }

  createSecret(metadatas, secret) {
    const now = Date.now();
    const saltedTitle = `${now}|${metadatas.title}`;
    const result = {};
    const newMetadas = metadatas;
    return getSHA256(saltedTitle)
      .then(hashedTitle => {
        result.hashedTitle = hashedTitle;
        newMetadas.id = result.hashedTitle;
        return this.encryptSecret(newMetadas, secret);
      })
      .then(secretObject => {
        result.secret = secretObject.secret;
        result.iv = secretObject.iv;
        result.metadatas = secretObject.metadatas;
        result.iv_meta = secretObject.iv_meta;
        result.hashedUsername = secretObject.hashedUsername;
        return this.wrapKey(secretObject.key, this.publicKey);
      })
      .then(wrappedKey => {
        result.wrappedKey = wrappedKey;
        return result;
      });
  }

  encryptSecret(metadatas, secret, key) {
    const result = {};
    return encryptAESGCM256(secret, key)
      .then(secretObject => {
        result.secret = secretObject.secret;
        result.iv = secretObject.iv;
        result.key = secretObject.key;
        return encryptAESGCM256(metadatas, secretObject.key);
      })
      .then(secretObject => {
        result.metadatas = secretObject.secret;
        result.iv_meta = secretObject.iv;
        return getSHA256(this.username);
      })
      .then(hashedUsername => {
        result.hashedUsername = hashedUsername;
        return result;
      });
  }

  decryptSecret(hashedTitle, secret) {
    if (typeof this.keys[hashedTitle] === 'undefined') {
      return Promise.reject("You don't have this secret");
    }
    const wrappedKey = this.keys[hashedTitle].key;
    return this.unwrapKey(wrappedKey).then(key =>
      decryptAESGCM256(secret, key));
  }

  unwrapKey(wrappedKey) {
    return unwrapRSAOAEP(wrappedKey, this.privateKey);
  }

  wrapKey(key, publicKey) {
    return wrapRSAOAEP(key, publicKey);
  }

  decryptAllMetadatas(allMetadatas, progress = defaultProgress) {
    const hashedTitles = Object.keys(this.keys);

    const progressStatus = new DecryptMetadataStatus(0, hashedTitles.length);
    progress(progressStatus);
    this.metadatas = {};
    return hashedTitles.reduce(
      (promise, hashedTitle) =>
        promise.then(() =>
          this.decryptSecret(
            hashedTitle,
            allMetadatas[hashedTitle]
          ).then(metadatas => {
            progressStatus.step();
            progress(progressStatus);
            this.metadatas[hashedTitle] = metadatas;
          })),
      Promise.resolve()
    );
  }

  activateShortLogin(shortpass, deviceName) {
    let protectKey;
    const toSend = {};
    return generateWrappingKey()
      .then(key => {
        protectKey = key;
        return exportKey(protectKey, this.privateKey);
      })
      .then(object => {
        localStorage.setItem(`${Secretin.prefix}privateKey`, object.key);
        localStorage.setItem(`${Secretin.prefix}privateKeyIv`, object.iv);
        return derivePassword(shortpass);
      })
      .then(derived => {
        toSend.salt = derived.salt;
        toSend.iterations = derived.iterations;
        toSend.hash = derived.hash;
        return exportKey(derived.key, protectKey);
      })
      .then(keyObject => {
        toSend.protectKey = keyObject.key;
        localStorage.setItem(`${Secretin.prefix}iv`, keyObject.iv);
        localStorage.setItem(`${Secretin.prefix}username`, this.username);
        return getSHA256(deviceName);
      })
      .then(deviceId => {
        toSend.deviceId = deviceId;
        localStorage.setItem(`${Secretin.prefix}deviceName`, deviceName);
        return toSend;
      });
  }

  shortLogin(shortpass, wrappedProtectKey) {
    const keyObject = {
      key: wrappedProtectKey,
      iv: localStorage.getItem(`${Secretin.prefix}iv`),
    };
    return importKey(shortpass, keyObject).then(protectKey => {
      const privateKeyObject = {
        privateKey: localStorage.getItem(`${Secretin.prefix}privateKey`),
        iv: localStorage.getItem(`${Secretin.prefix}privateKeyIv`),
      };
      return this.importPrivateKey(protectKey, privateKeyObject);
    });
  }
}

Object.defineProperty(User, 'defaultOptions', {
  value: {
    timeToClose: 30,
  },
  writable: false,
  enumerable: true,
  configurable: false,
});

export default User;
