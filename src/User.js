import {
  getSHA256,
  exportPrivateKey,
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
      });
  }

  exportPublicKey() {
    return exportPublicKey(this.publicKey);
  }

  importPublicKey(jwkPublicKey) {
    return importPublicKey(jwkPublicKey)
      .then(
        (publicKey) => { this.publicKey = publicKey; }
      );
  }

  exportPrivateKey(dKey) {
    return exportPrivateKey(dKey, this.privateKey)
      .then(
        (privateKeyObject) => ({
          privateKey: bytesToHexString(privateKeyObject.privateKey),
          iv: bytesToHexString(privateKeyObject.iv),
        })
      );
  }

  importPrivateKey(dKey, privateKeyObject) {
    return importPrivateKey(dKey, privateKeyObject)
      .then(
        (privateKey) => { this.privateKey = privateKey; }
      );
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

  editSecret(metadatas, secret, wrappedKey) {
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
    return this.encryptSecret(metadatas, secret)
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
        return getSHA256(saltedTitle);
      })
      .then((hashedTitle) => {
        result.hashedTitle = bytesToHexString(hashedTitle);
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

  decryptSecret(secret, wrappedKey) {
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
        this.decryptSecret(allMetadatas[hashedTitle], this.keys[hashedTitle].key)
          .then((metadatas) => {
            this.metadatas[hashedTitle] = JSON.parse(metadatas);
          })
      );
    });

    return Promise.all(decryptMetadatasPromises);
  }

  // TODO: Should be removed after migration
  decryptTitles() {
    return new Promise((resolve) => {
      const hashedTitles = Object.keys(this.keys);
      let total = hashedTitles.length;
      hashedTitles.forEach((hashedTitle) => {
        this.titles = {};
        if (typeof this.keys[hashedTitle].title !== 'undefined') {
          decryptRSAOAEP(this.keys[hashedTitle].title, this.privateKey)
            .then((title) => {
              this.titles[hashedTitle] = bytesToASCIIString(title);
              if (Object.keys(this.titles).length === total) {
                resolve();
              }
            });
        } else {
          total -= 1;
          if (total === 0) {
            // eslint-disable-next-line
            console.log('Every secrets migrated');
          }
        }
      });
    });
  }
}


export default User;
