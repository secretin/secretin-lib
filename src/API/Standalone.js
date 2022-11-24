import { bytesToHexString } from '../lib/utils';
import {
  UsernameAlreadyExistsError,
  SecretAlreadyExistsError,
  UserNotFoundError,
  CantEditSecretError,
  SecretNotFoundError,
  CantGenerateNewKeyError,
  NotSharedWithUserError,
  CantUnshareSecretError,
  CantShareSecretError,
  FriendNotFoundError,
  CantShareWithYourselfError,
  DontHaveSecretError,
  NotAvailableError,
  SomethingGoesWrong,
} from '../Errors';

class API {
  constructor(db, getSHA256) {
    if (typeof db === 'object') {
      this.db = db;
    } else {
      this.db = { users: {}, secrets: {} };
    }
    this.getSHA256 = getSHA256;
  }

  userExists(username, isHashed) {
    return this.retrieveUser(username, 'undefined', isHashed).then(
      () => true,
      () => false
    );
  }

  addUser({
    username,
    privateKey,
    publicKey,
    privateKeySign,
    publicKeySign,
    pass,
    options,
  }) {
    let hashedUsername;
    return this.getSHA256(username)
      .then((rHashedUsername) => {
        hashedUsername = rHashedUsername;
        return new Promise((resolve, reject) => {
          if (typeof this.db.users[hashedUsername] === 'undefined') {
            resolve(this.getSHA256(pass.hash));
          } else {
            reject(new UsernameAlreadyExistsError());
          }
        });
      })
      .then((hashedHash) => {
        this.db.users[hashedUsername] = {
          pass: {
            salt: pass.salt,
            hash: hashedHash,
            iterations: pass.iterations,
          },
          privateKeySign,
          publicKeySign,
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
            history: secretObject.history,
            iv: secretObject.iv,
            iv_meta: secretObject.iv_meta,
            iv_history: secretObject.iv_history,
            users: [secretObject.hashedUsername],
            rev: 'Standalone',
          };
          this.db.users[secretObject.hashedUsername].keys[
            secretObject.hashedTitle
          ] = {
            key: secretObject.wrappedKey,
            rights: 2,
          };
          resolve();
        }
        reject(new SecretAlreadyExistsError());
      } else {
        reject(new UserNotFoundError());
      }
    });
  }

  deleteSecret(user, hashedTitle) {
    let hashedUsername;
    return this.getSHA256(user.username).then((rHashedUsername) => {
      hashedUsername = rHashedUsername;
      if (typeof this.db.users[hashedUsername] !== 'undefined') {
        if (typeof this.db.secrets[hashedTitle] === 'undefined') {
          return Promise.reject(new SecretNotFoundError());
        }
        delete this.db.users[hashedUsername].keys[hashedTitle];
        const index =
          this.db.secrets[hashedTitle].users.indexOf(hashedUsername);
        if (index > -1) {
          this.db.secrets[hashedTitle].users.splice(index, 1);
        }
        if (this.db.secrets[hashedTitle].users.length === 0) {
          delete this.db.secrets[hashedTitle];
        }
        return Promise.resolve();
      }
      return Promise.reject(new UserNotFoundError());
    });
  }

  editSecret(user, secretObject, hashedTitle) {
    let hashedUsername;
    return this.getSHA256(user.username).then((rHashedUsername) => {
      hashedUsername = rHashedUsername;
      if (typeof this.db.users[hashedUsername] !== 'undefined') {
        if (typeof this.db.secrets[hashedTitle] !== 'undefined') {
          if (
            typeof this.db.users[hashedUsername].keys[hashedTitle].rights ===
              'undefined' ||
            this.db.users[hashedUsername].keys[hashedTitle].rights <= 0
          ) {
            return Promise.reject(new CantEditSecretError());
          }
          this.db.secrets[hashedTitle].iv = secretObject.iv;
          this.db.secrets[hashedTitle].secret = secretObject.secret;
          this.db.secrets[hashedTitle].iv_meta = secretObject.iv_meta;
          this.db.secrets[hashedTitle].metadatas = secretObject.metadatas;
          this.db.secrets[hashedTitle].editOffline = true;
          this.db.secrets[hashedTitle].iv_history = secretObject.iv_history;
          this.db.secrets[hashedTitle].history = secretObject.history;
          return Promise.resolve();
        }
        return Promise.reject(new SecretNotFoundError());
      }
      return Promise.reject(new UserNotFoundError());
    });
  }

  newKey(user, hashedTitle, secret, wrappedKeys) {
    let hashedUsername;
    return this.getSHA256(user.username).then((rHashedUsername) => {
      hashedUsername = rHashedUsername;
      if (typeof this.db.users[hashedUsername] !== 'undefined') {
        if (typeof this.db.secrets[hashedTitle] !== 'undefined') {
          if (
            typeof this.db.users[hashedUsername].keys[hashedTitle].rights ===
              'undefined' ||
            this.db.users[hashedUsername].keys[hashedTitle].rights <= 1
          ) {
            return Promise.reject(new CantGenerateNewKeyError());
          }
          this.db.secrets[hashedTitle].iv = secret.iv;
          this.db.secrets[hashedTitle].secret = secret.secret;
          this.db.secrets[hashedTitle].iv_meta = secret.iv_meta;
          this.db.secrets[hashedTitle].metadatas = secret.metadatas;
          this.db.secrets[hashedTitle].iv_history = secret.iv_history;
          this.db.secrets[hashedTitle].history = secret.history;
          wrappedKeys.forEach((wrappedKey) => {
            if (typeof this.db.users[wrappedKey.user] !== 'undefined') {
              if (
                typeof this.db.users[wrappedKey.user].keys[hashedTitle] !==
                'undefined'
              ) {
                this.db.users[wrappedKey.user].keys[hashedTitle].key =
                  wrappedKey.key;
              }
            }
          });
          return Promise.resolve();
        }
        return Promise.reject(new SecretNotFoundError());
      }
      return Promise.reject(new UserNotFoundError());
    });
  }

  unshareSecret(user, friendNames, hashedTitle) {
    let hashedUsername;
    const hashedFriendUsernames = [];
    return this.getSHA256(user.username)
      .then((rHashedUsername) => {
        hashedUsername = rHashedUsername;
        const hashedFriendUseramePromises = [];
        friendNames.forEach((username) => {
          hashedFriendUseramePromises.push(this.getSHA256(username));
        });
        return Promise.all(hashedFriendUseramePromises);
      })
      .then((rHashedFriendUserames) => {
        rHashedFriendUserames.forEach((hashedFriendUserame) => {
          hashedFriendUsernames.push(hashedFriendUserame);
        });
        if (typeof this.db.users[hashedUsername] !== 'undefined') {
          if (typeof this.db.secrets[hashedTitle] !== 'undefined') {
            if (
              typeof this.db.users[hashedUsername].keys[hashedTitle].rights !==
                'undefined' &&
              this.db.users[hashedUsername].keys[hashedTitle].rights > 1
            ) {
              let yourself = 0;
              let nb = 0;
              let response = 'Secret unshared';
              hashedFriendUsernames.forEach((hashedFriendUsername) => {
                if (hashedUsername !== hashedFriendUsername) {
                  const dbUser = this.db.users[hashedFriendUsername];
                  if (typeof dbUser !== 'undefined') {
                    if (typeof dbUser.keys[hashedTitle] !== 'undefined') {
                      delete dbUser.keys[hashedTitle];
                      const id =
                        this.db.secrets[hashedTitle].users.indexOf(
                          hashedFriendUsername
                        );
                      this.db.secrets[hashedTitle].users.splice(id, 1);
                      nb += 1;
                    } else {
                      throw new NotSharedWithUserError();
                    }
                  } else {
                    throw new NotSharedWithUserError();
                  }
                } else {
                  yourself = 1;
                  if (hashedFriendUsernames.length === 1) {
                    response = "You can't unshare with yourself";
                  }
                }
              });
              if (nb === hashedFriendUsernames.length - yourself) {
                return response;
              }
              return Promise.reject(new SomethingGoesWrong());
            }
            return Promise.reject(new CantUnshareSecretError());
          }
          return Promise.reject(new SecretNotFoundError());
        }
        return Promise.reject(new UserNotFoundError());
      });
  }

  shareSecret(user, sharedSecretObjects) {
    let hashedUsername;
    return this.getSHA256(user.username).then((rHashedUsername) => {
      hashedUsername = rHashedUsername;
      const dbUser = this.db.users[hashedUsername];
      if (typeof dbUser !== 'undefined') {
        let nb = 0;
        sharedSecretObjects.forEach((sharedSecretObject) => {
          if (sharedSecretObject.friendName !== hashedUsername) {
            if (
              typeof this.db.secrets[sharedSecretObject.hashedTitle] !==
              'undefined'
            ) {
              if (
                typeof dbUser.keys[sharedSecretObject.hashedTitle].rights !==
                  'undefined' &&
                dbUser.keys[sharedSecretObject.hashedTitle].rights > 1
              ) {
                const dbFriend = this.db.users[sharedSecretObject.friendName];
                if (typeof dbFriend !== 'undefined') {
                  dbFriend.keys[sharedSecretObject.hashedTitle] = {
                    key: sharedSecretObject.wrappedKey,
                    rights: sharedSecretObject.rights,
                  };
                  const { users } =
                    this.db.secrets[sharedSecretObject.hashedTitle];
                  if (users.indexOf(sharedSecretObject.friendName) < 0) {
                    users.push(sharedSecretObject.friendName);
                  }
                  nb += 1;
                } else {
                  throw new FriendNotFoundError();
                }
              } else {
                throw new CantShareSecretError();
              }
            } else {
              throw new SecretNotFoundError();
            }
          } else {
            throw new CantShareWithYourselfError();
          }
        });
        if (nb !== sharedSecretObjects.length) {
          return Promise.reject(new SomethingGoesWrong());
        }
        return Promise.resolve();
      }
      return Promise.reject(new UserNotFoundError());
    });
  }

  retrieveUser(username, hash, hashed) {
    let hashedUsername = username;
    let user;
    let isHashed = Promise.resolve();

    if (!hashed) {
      isHashed = isHashed
        .then(() => this.getSHA256(username))
        .then((rHashedUsername) => {
          hashedUsername = rHashedUsername;
        });
    }

    return isHashed
      .then(() => {
        if (typeof this.db.users[hashedUsername] === 'undefined') {
          return Promise.reject(new UserNotFoundError());
        }
        user = JSON.parse(JSON.stringify(this.db.users[hashedUsername]));
        return this.getSHA256(hash);
      })
      .then((hashedHash) => {
        delete user.keys;
        if (hashedHash === user.pass.hash) {
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
        user.pass.hash = fakeHash;
        return user;
      });
  }

  getDerivationParameters(username, isHashed) {
    return this.retrieveUser(username, 'undefined', isHashed).then((user) => ({
      totp: user.pass.totp,
      salt: user.pass.salt,
      iterations: user.pass.iterations,
    }));
  }

  getPublicKey(username, isHashed) {
    return this.retrieveUser(username, 'undefined', isHashed).then(
      (user) => user.publicKey
    );
  }

  getUser(username, hash) {
    return this.retrieveUser(username, hash, false);
  }

  getUserWithSignature(user) {
    let hashedUsername;
    return this.getSHA256(user.username).then((rHashedUsername) => {
      hashedUsername = rHashedUsername;
      return new Promise((resolve, reject) => {
        if (typeof this.db.users[hashedUsername] === 'undefined') {
          reject(new UserNotFoundError());
        } else {
          const userObject = JSON.parse(
            JSON.stringify(this.db.users[hashedUsername])
          );
          const metadatas = {};
          const hashedTitles = Object.keys(userObject.keys);
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

  getSecret(hash) {
    return new Promise((resolve, reject) => {
      if (typeof this.db.secrets[hash] === 'undefined') {
        reject(new DontHaveSecretError());
      } else {
        resolve(this.db.secrets[hash]);
      }
    });
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

  getHistory(user, hash) {
    return new Promise((resolve, reject) => {
      if (typeof this.db.secrets[hash] === 'undefined') {
        reject(new DontHaveSecretError());
      } else {
        const secret = this.db.secrets[hash];
        const history = {
          iv: secret.iv_history,
          secret: secret.history,
        };
        resolve(history);
      }
    });
  }

  // eslint-disable-next-line class-methods-use-this
  getProtectKeyParameters() {
    return Promise.reject(new NotAvailableError());
  }

  getDb() {
    return new Promise((resolve) => {
      resolve(this.db);
    });
  }

  editUser(user, datas) {
    let hashedUsername;
    return this.getSHA256(user.username).then((rHashedUsername) => {
      hashedUsername = rHashedUsername;
      return new Promise((resolve, reject) => {
        if (typeof this.db.users[hashedUsername] !== 'undefined') {
          if (
            typeof datas.privateKey !== 'undefined' &&
            typeof datas.pass !== 'undefined'
          ) {
            resolve(
              this.changePassword(hashedUsername, datas.privateKey, datas.pass)
            );
          } else {
            if (typeof datas.options === 'undefined') {
              this.db.users[hashedUsername].metadataCache = datas;
            } else {
              this.db.users[hashedUsername].options = datas;
            }
            resolve();
          }
        } else {
          reject(new UserNotFoundError());
        }
      });
    });
  }

  changePassword(hashedUsername, privateKey, pass) {
    return this.getSHA256(pass.hash).then((hashedHash) => {
      const newPass = pass;
      newPass.hash = hashedHash;
      this.db.users[hashedUsername].privateKey = privateKey;
      this.db.users[hashedUsername].pass = newPass;
    });
  }

  // eslint-disable-next-line class-methods-use-this
  isOnline() {
    return new Promise((resolve) => {
      resolve(false);
    });
  }
}

export default API;
