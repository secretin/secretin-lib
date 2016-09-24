import {
  getSHA256,
  exportKey,
  importKey,
  genRSAOAEP,
  decryptRSAOAEP,
  encryptRSAOAEP,
  exportPublicKey,
  importPublicKey,
  importPrivateKey,
  encryptAESGCM256,
  decryptAESGCM256,
  wrapRSAOAEP,
  unwrapRSAOAEP,
  generateWrappingKey,
  derivePassword,
} from './lib/crypto';

import {
  bytesToHexString,
  bytesToASCIIString,
} from './lib/util';


class User {
  constructor(username) {
    this.username = username;
    this.publicKey = null;
    this.privateKey = null;
    this.keys = {};
    this.hash = '';
    this.totp = false;
    this.metadatas = {};
    this.token = {
      value: '',
      time: 0,
    };
  }

  disconnect() {
    delete this.username;
    delete this.publicKey;
    delete this.privateKey;
    delete this.metadatas;
    delete this.keys;
    delete this.token;
  }

  isTokenValid() {
    return this.token.time > (Date.now() - 10000);
  }

  getToken(api) {
    if (this.isTokenValid()) {
      return this.token.value;
    }

    return api.getNewChallenge(this)
      .then((challenge) => {
        this.token.time = challenge.time;
        this.token.value = decryptRSAOAEP(challenge.value, this.privateKey);
        return this.token.value;
      });
  }

  generateMasterKey() {
    return genRSAOAEP()
      .then((keyPair) => {
        this.publicKey = keyPair.publicKey;
        this.privateKey = keyPair.privateKey;
        return;
      });
  }

  exportPublicKey() {
    return exportPublicKey(this.publicKey);
  }

  importPublicKey(jwkPublicKey) {
    return importPublicKey(jwkPublicKey)
      .then((publicKey) => {
        this.publicKey = publicKey;
        return;
      });
  }

  exportPrivateKey(password) {
    const pass = {};
    return derivePassword(password)
      .then((dKey) => {
        pass.salt = bytesToHexString(dKey.salt);
        this.hash = bytesToHexString(dKey.hash);
        pass.hash = this.hash;
        pass.iterations = dKey.iterations;
        return exportKey(dKey.key, this.privateKey);
      })
      .then((keyObject) => ({
        privateKey: {
          privateKey: bytesToHexString(keyObject.key),
          iv: bytesToHexString(keyObject.iv),
        },
        pass,
      }));
  }

  importPrivateKey(dKey, privateKeyObject) {
    return importPrivateKey(dKey, privateKeyObject)
      .then((privateKey) => {
        this.privateKey = privateKey;
        return;
      });
  }

  encryptTitle(title, publicKey) {
    return encryptRSAOAEP(title, publicKey)
      .then((encryptedTitle) => bytesToHexString(encryptedTitle));
  }

  shareSecret(friend, wrappedKey, hashedTitle) {
    const result = { hashedTitle };
    return this.unwrapKey(wrappedKey)
    .then((key) => this.wrapKey(key, friend.publicKey))
    .then((friendWrappedKey) => {
      result.wrappedKey = friendWrappedKey;
      return getSHA256(friend.username);
    })
    .then((hashedUsername) => {
      result.friendName = bytesToHexString(hashedUsername);
      return result;
    });
  }

  editSecret(hashedTitle, secret) {
    const metadatas = this.metadatas[hashedTitle];
    const now = new Date();
    metadatas.lastModifiedAt = now.toISOString();
    metadatas.lastModifiedBy = this.username;
    const wrappedKey = this.keys[hashedTitle].key;
    const result = {};
    return this.unwrapKey(wrappedKey)
      .then((key) => this.encryptSecret(metadatas, secret, key))
      .then((secretObject) => {
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
      .then((hashedTitle) => {
        result.hashedTitle = bytesToHexString(hashedTitle);
        newMetadas.id = result.hashedTitle;
        return this.encryptSecret(newMetadas, secret);
      })
      .then((secretObject) => {
        result.secret = secretObject.secret;
        result.iv = secretObject.iv;
        result.metadatas = secretObject.metadatas;
        result.iv_meta = secretObject.iv_meta;
        result.hashedUsername = secretObject.hashedUsername;
        return this.wrapKey(secretObject.key, this.publicKey);
      })
      .then((wrappedKey) => {
        result.wrappedKey = wrappedKey;
        return result;
      });
  }

  encryptSecret(metadatas, secret, key) {
    const result = {};
    return encryptAESGCM256(secret, key)
      .then((secretObject) => {
        result.secret = bytesToHexString(secretObject.secret);
        result.iv = bytesToHexString(secretObject.iv);
        result.key = secretObject.key;
        return encryptAESGCM256(metadatas, secretObject.key);
      })
      .then((secretObject) => {
        result.metadatas = bytesToHexString(secretObject.secret);
        result.iv_meta = bytesToHexString(secretObject.iv);
        return getSHA256(this.username);
      })
      .then((hashedUsername) => {
        result.hashedUsername = bytesToHexString(hashedUsername);
        return result;
      });
  }

  decryptSecret(hashedTitle, secret) {
    const wrappedKey = this.keys[hashedTitle].key;
    return this.unwrapKey(wrappedKey)
      .then((key) => decryptAESGCM256(secret, key))
      .then((decryptedSecret) => bytesToASCIIString(decryptedSecret));
  }

  unwrapKey(wrappedKey) {
    return unwrapRSAOAEP(wrappedKey, this.privateKey);
  }

  wrapKey(key, publicKey) {
    return wrapRSAOAEP(key, publicKey)
      .then((wrappedKey) => bytesToHexString(wrappedKey));
  }

  decryptAllMetadatas(allMetadatas) {
    const decryptMetadatasPromises = [];
    const hashedTitles = Object.keys(this.keys);

    this.metadatas = {};
    hashedTitles.forEach((hashedTitle) => {
      decryptMetadatasPromises.push(
        this.decryptSecret(hashedTitle, allMetadatas[hashedTitle])
          .then((metadatas) => {
            this.metadatas[hashedTitle] = JSON.parse(metadatas);
            return;
          })
      );
    });

    return Promise.all(decryptMetadatasPromises);
  }

  activateShortpass(shortpass, deviceName) {
    let protectKey;
    const toSend = {};
    return generateWrappingKey()
      .then((key) => {
        protectKey = key;
        return exportKey(protectKey, this.privateKey);
      })
      .then((object) => {
        localStorage.setItem('privateKey', bytesToHexString(object.key));
        localStorage.setItem('privateKeyIv', bytesToHexString(object.iv));
        return derivePassword(shortpass);
      })
      .then((derived) => {
        toSend.salt = bytesToHexString(derived.salt);
        toSend.iterations = derived.iterations;
        toSend.hash = bytesToHexString(derived.hash);
        return exportKey(derived.key, protectKey);
      })
      .then((keyObject) => {
        toSend.protectKey = bytesToHexString(keyObject.key);
        localStorage.setItem('iv', bytesToHexString(keyObject.iv));
        localStorage.setItem('username', this.username);
        return getSHA256(deviceName);
      })
      .then((deviceId) => {
        toSend.deviceId = bytesToHexString(deviceId);
        localStorage.setItem('deviceName', deviceName);
        return toSend;
      });
  }

  shortLogin(shortpass, wrappedProtectKey) {
    const keyObject = {
      key: wrappedProtectKey,
      iv: localStorage.getItem('iv'),
    };
    return importKey(shortpass, keyObject)
      .then((protectKey) => {
        const privateKeyObject = {
          privateKey: localStorage.getItem('privateKey'),
          iv: localStorage.getItem('privateKeyIv'),
        };
        return importPrivateKey(protectKey, privateKeyObject);
      })
      .then((privateKey) => {
        this.privateKey = privateKey;
        return;
      });
  }
}


export default User;
