import {
  getSHA256,
  encryptRSAOAEP,
} from '../lib/crypto';

import {
  bytesToHexString,
  bytesToASCIIString,
} from '../lib/util';


class API {
  constructor(db) {
    if (typeof db === 'object') {
      this.db = db;
    } else {
      this.db = { users: {}, secrets: {} };
    }
  }

  userExists(username, isHashed) {
    return this.retrieveUser(username, 'undefined', isHashed)
      .then(() => true, () => false);
  }

  addUser(username, privateKey, publicKey, pass, options) {
    let hashedUsername;
    return getSHA256(username)
      .then((rHashedUsername) => {
        hashedUsername = rHashedUsername;
        return new Promise((resolve, reject) => {
          if (typeof this.db.users[bytesToHexString(hashedUsername)] === 'undefined') {
            resolve(getSHA256(pass.hash));
          } else {
            reject('Username already exists');
          }
        });
      })
      .then((hashedHash) => {
        this.db.users[bytesToHexString(hashedUsername)] = {
          pass: {
            salt: pass.salt,
            hash: bytesToHexString(hashedHash),
            iterations: pass.iterations,
          },
          privateKey,
          publicKey,
          keys: {},
          options,
        };
      });
  }

  addSecret(user, secretObject) {
    return new Promise((resolve, reject) => {
      if (typeof this.db.users[secretObject.hashedUsername] !== 'undefined') {
        if (typeof this.db.secrets[secretObject.hashedTitle] === 'undefined') {
          this.db.secrets[secretObject.hashedTitle] = {
            secret: secretObject.secret,
            metadatas: secretObject.metadatas,
            iv: secretObject.iv,
            iv_meta: secretObject.iv_meta,
            users: [secretObject.hashedUsername],
          };
          this.db.users[secretObject.hashedUsername].keys[secretObject.hashedTitle] = {
            key: secretObject.wrappedKey,
            rights: 2,
          };
          resolve();
        }
        reject('Secret already exists');
      } else {
        reject('User not found');
      }
    });
  }

  deleteSecret(user, hashedTitle) {
    let hashedUsername;
    return getSHA256(user.username)
      .then((rHashedUsername) => {
        hashedUsername = bytesToHexString(rHashedUsername);
        if (typeof this.db.users[hashedUsername] !== 'undefined') {
          if (typeof this.db.secrets[hashedTitle] === 'undefined') {
            throw ('Secret not found');
          }
          delete this.db.users[hashedUsername].keys[hashedTitle];
          const index = this.db.secrets[hashedTitle].users.indexOf(hashedUsername);
          if (index > -1) {
            this.db.secrets[hashedTitle].users.splice(index, 1);
          }
          if (this.db.secrets[hashedTitle].users.length === 0) {
            delete this.db.secrets[hashedTitle];
          }
        } else {
          throw ('User not found');
        }
      });
  }

  getNewChallenge(user) {
    return getSHA256(user.username)
      .then(() => {
        const rawChallenge = new Uint8Array(32);
        crypto.getRandomValues(rawChallenge);
        const challenge = bytesToASCIIString(rawChallenge);
        return encryptRSAOAEP(challenge, user.publicKey);
      }).then((encryptedChallenge) =>
        ({
          time: Date.now().toString(),
          value: bytesToHexString(encryptedChallenge),
        })
      );
  }

  editSecret(user, secretObject, hashedTitle) {
    let hashedUsername;
    return getSHA256(user.username)
      .then((rHashedUsername) => {
        hashedUsername = bytesToHexString(rHashedUsername);
        if (typeof this.db.users[hashedUsername] !== 'undefined') {
          if (typeof this.db.secrets[hashedTitle] !== 'undefined') {
            if (typeof this.db.users[hashedUsername].keys[hashedTitle].rights === 'undefined'
                || this.db.users[hashedUsername].keys[hashedTitle].rights <= 0) {
              throw 'You can\'t edit this secret';
            }
            this.db.secrets[hashedTitle].iv = secretObject.iv;
            this.db.secrets[hashedTitle].secret = secretObject.secret;
            this.db.secrets[hashedTitle].iv_meta = secretObject.iv_meta;
            this.db.secrets[hashedTitle].metadatas = secretObject.metadatas;
            return Promise.resolve();
          }
          return Promise.reject('Secret not found');
        }
        return Promise.reject('User not found');
      });
  }

  newKey(user, hashedTitle, secret, wrappedKeys) {
    let hashedUsername;
    return getSHA256(user.username)
      .then((rHashedUsername) => {
        hashedUsername = bytesToHexString(rHashedUsername);
        if (typeof this.db.users[hashedUsername] !== 'undefined') {
          if (typeof this.db.secrets[hashedTitle] !== 'undefined') {
            if (typeof this.db.users[hashedUsername].keys[hashedTitle].rights === 'undefined'
                || this.db.users[hashedUsername].keys[hashedTitle].rights <= 1) {
              throw ('You can\'t generate new key for this secret');
            }
            this.db.secrets[hashedTitle].iv = secret.iv;
            this.db.secrets[hashedTitle].secret = secret.secret;
            this.db.secrets[hashedTitle].iv_meta = secret.iv_meta;
            this.db.secrets[hashedTitle].metadatas = secret.metadatas;
            wrappedKeys.forEach((wrappedKey) => {
              if (typeof this.db.users[wrappedKey.user] !== 'undefined') {
                if (typeof this.db.users[wrappedKey.user].keys[hashedTitle] !== 'undefined') {
                  this.db.users[wrappedKey.user].keys[hashedTitle].key = wrappedKey.key;
                }
              }
            });
          } else {
            throw ('Secret not found');
          }
        } else {
          throw ('User not found');
        }
      });
  }

  unshareSecret(user, friendNames, hashedTitle) {
    let hashedUsername;
    const hashedFriendUsernames = [];
    return getSHA256(user.username)
      .then((rHashedUsername) => {
        hashedUsername = bytesToHexString(rHashedUsername);
        const hashedFriendUseramePromises = [];
        friendNames.forEach((username) => {
          hashedFriendUseramePromises.push(getSHA256(username));
        });
        return Promise.all(hashedFriendUseramePromises);
      })
      .then((rHashedFriendUserames) => {
        rHashedFriendUserames.forEach((hashedFriendUserame) => {
          hashedFriendUsernames.push(bytesToHexString(hashedFriendUserame));
        });
        if (typeof this.db.users[hashedUsername] !== 'undefined') {
          if (typeof this.db.secrets[hashedTitle] !== 'undefined') {
            if (typeof this.db.users[hashedUsername].keys[hashedTitle].rights !== 'undefined'
                && this.db.users[hashedUsername].keys[hashedTitle].rights > 1) {
              let yourself = 0;
              let nb = 0;
              let response = 'Secret unshared';
              hashedFriendUsernames.forEach((hashedFriendUsername) => {
                if (hashedUsername !== hashedFriendUsername) {
                  const dbUser = this.db.users[hashedFriendUsername];
                  if (typeof dbUser !== 'undefined') {
                    if (typeof dbUser.keys[hashedTitle] !== 'undefined') {
                      delete dbUser.keys[hashedTitle];
                      const id = this.db.secrets[hashedTitle].users.indexOf(hashedFriendUsername);
                      this.db.secrets[hashedTitle].users.splice(id, 1);
                      nb += 1;
                    } else {
                      throw (`You didn't share this secret with ${hashedFriendUsername}`);
                    }
                  } else {
                    throw (`${hashedFriendUsername} not found`);
                  }
                } else {
                  yourself = 1;
                  if (hashedFriendUsernames.length === 1) {
                    response = 'You can\'t unshare with yourself';
                  }
                }
              });
              if (nb === hashedFriendUsernames.length - yourself) {
                return response;
              }
              throw ('Something goes wrong.');
            } else {
              throw ('You can\'t unshare this secret');
            }
          } else {
            throw ('Secret not found');
          }
        } else {
          throw ('User not found');
        }
      });
  }

  shareSecret(user, sharedSecretObjects) {
    let hashedUsername;
    return getSHA256(user.username)
      .then((rHashedUsername) => {
        hashedUsername = bytesToHexString(rHashedUsername);
        const dbUser = this.db.users[hashedUsername];
        if (typeof dbUser !== 'undefined') {
          let nb = 0;
          sharedSecretObjects.forEach((sharedSecretObject) => {
            if (sharedSecretObject.friendName !== hashedUsername) {
              if (typeof this.db.secrets[sharedSecretObject.hashedTitle] !== 'undefined') {
                if (typeof dbUser.keys[sharedSecretObject.hashedTitle].rights !== 'undefined'
                    && dbUser.keys[sharedSecretObject.hashedTitle].rights > 1) {
                  const dbFriend = this.db.users[sharedSecretObject.friendName];
                  if (typeof dbFriend !== 'undefined') {
                    dbFriend.keys[sharedSecretObject.hashedTitle] = {
                      key: sharedSecretObject.wrappedKey,
                      rights: sharedSecretObject.rights,
                    };
                    const users = this.db.secrets[sharedSecretObject.hashedTitle].users;
                    if (users.indexOf(sharedSecretObject.friendName) < 0) {
                      users.push(sharedSecretObject.friendName);
                    }
                    nb += 1;
                  } else {
                    throw (`Friend ${sharedSecretObject.friendName} not found`);
                  }
                } else {
                  throw ('You can\'t share this secret');
                }
              } else {
                throw ('Secret not found');
              }
            } else {
              throw ('You can\'t share with yourself');
            }
          });
          if (nb !== sharedSecretObjects.length) {
            throw ('Something goes wrong.');
          }
        } else {
          throw ('User not found');
        }
      });
  }

  retrieveUser(username, hash, hashed) {
    let hashedUsername = username;
    let user;
    let isHashed = Promise.resolve();

    if (!hashed) {
      isHashed = isHashed
        .then(() => getSHA256(username))
        .then((rHashedUsername) => {
          hashedUsername = bytesToHexString(rHashedUsername);
        });
    }


    return isHashed
      .then(() => {
        if (typeof this.db.users[hashedUsername] === 'undefined') {
          throw 'User not found';
        } else {
          user = JSON.parse(JSON.stringify(this.db.users[hashedUsername]));
          return getSHA256(hash);
        }
      })
      .then((hashedHash) => {
        if (bytesToHexString(hashedHash) === user.pass.hash) {
          const metadatas = {};
          const hashedTitles = Object.keys(user.keys);
          hashedTitles.forEach((hashedTitle) => {
            const secret = this.db.secrets[hashedTitle];
            metadatas[hashedTitle] = {
              iv: secret.iv_meta,
              secret: secret.metadatas,
            };
          });
          user.metadatas = metadatas;
          return user;
        }
        const fakePrivateKey = new Uint8Array(3232);
        const fakeIV = new Uint8Array(16);
        const fakeHash = new Uint8Array(32);
        crypto.getRandomValues(fakePrivateKey);
        crypto.getRandomValues(fakeIV);
        crypto.getRandomValues(fakeHash);
        user.privateKey = {
          privateKey: bytesToHexString(fakePrivateKey),
          iv: bytesToHexString(fakeIV),
        };
        user.keys = {};
        user.metadatas = {};
        user.pass.hash = fakeHash;
        return user;
      });
  }

  getDerivationParameters(username, isHashed) {
    return this.retrieveUser(username, 'undefined', isHashed)
      .then((user) => ({
        totp: user.pass.totp,
        salt: user.pass.salt,
        iterations: user.pass.iterations,
      }));
  }

  getPublicKey(username, isHashed) {
    return this.retrieveUser(username, 'undefined', isHashed)
      .then((user) => user.publicKey);
  }

  getUser(username, hash) {
    return this.retrieveUser(username, hash, false);
  }

  getUserWithSignature(user) {
    let hashedUsername;
    return getSHA256(user.username)
      .then((rHashedUsername) => {
        hashedUsername = bytesToHexString(rHashedUsername);
        return new Promise((resolve, reject) => {
          if (typeof this.db.users[hashedUsername] === 'undefined') {
            reject('User not found');
          } else {
            const userObject = JSON.parse(JSON.stringify(this.db.users[hashedUsername]));
            const metadatas = {};
            const hashedTitles = Object.keys(user.keys);
            hashedTitles.forEach((hashedTitle) => {
              const secret = this.db.secrets[hashedTitle];
              metadatas[hashedTitle] = {
                iv: secret.iv_meta,
                secret: secret.metadatas,
              };
            });
            userObject.metadatas = metadatas;
            resolve(userObject);
          }
        });
      });
  }

  getSecret(hash, user) {
    return user.sign(hash)
      .then(() =>
        new Promise((resolve, reject) => {
          if (typeof this.db.secrets[hash] === 'undefined') {
            reject('Invalid secret');
          } else {
            resolve(this.db.secrets[hash]);
          }
        })
      );
  }

  getAllMetadatas(user) {
    const result = {};
    return new Promise((resolve) => {
      const hashedTitles = Object.keys(user.keys);
      hashedTitles.forEach((hashedTitle) => {
        const secret = this.db.secrets[hashedTitle];
        result[hashedTitle] = {
          iv: secret.iv_meta,
          secret: secret.metadatas,
        };
      });
      resolve(result);
    });
  }

  getDb() {
    return new Promise((resolve) => {
      resolve(this.db);
    });
  }

  editUser(user, datas, type) {
    let hashedUsername;
    return getSHA256(user.username)
      .then((rHashedUsername) => {
        hashedUsername = bytesToHexString(rHashedUsername);
        return new Promise((resolve, reject) => {
          if (typeof this.db.users[hashedUsername] !== 'undefined') {
            if (type === 'password') {
              resolve(this.changePassword(hashedUsername, datas.privateKey, datas.pass));
            } else {
              this.db.users[hashedUsername].options = datas;
              resolve();
            }
          } else {
            reject('User not found');
          }
        });
      });
  }

  changePassword(hashedUsername, privateKey, pass) {
    return getSHA256(pass.hash)
      .then((hashedHash) => {
        const newPass = pass;
        newPass.hash = bytesToHexString(hashedHash);
        this.db.users[hashedUsername].privateKey = privateKey;
        this.db.users[hashedUsername].pass = newPass;
      });
  }

}

export default API;
