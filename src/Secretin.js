import {
  derivePassword,
} from './lib/crypto';

import {
  WrappingError,
  UsernameAlreadyExistsError,
  NeedTOTPTokenError,
  DisconnectedError,
  DontHaveSecretError,
  FolderNotFoundError,
  FolderInItselfError,
  LocalStorageUnavailableError,
} from './Errors';

import {
  bytesToHexString,
  hexStringToUint8Array,
  localStorageAvailable,
  xorSeed,
} from './lib/utils';

import APIStandalone from './API/Standalone';
import User from './User';

class Secretin {
  constructor(API = APIStandalone, db) {
    this.api = new API(db);
    this.currentUser = {};
  }

  changeDB(db) {
    if (typeof this.currentUser.username !== 'undefined') {
      this.currentUser.disconnect();
    }
    this.currentUser = {};
    this.api = new this.api.constructor(db);
  }

  newUser(username, password) {
    let privateKey;
    let pass;
    let options;
    this.currentUser = new User(username);
    return this.api.userExists(username)
      .then((exists) =>
        new Promise((resolve, reject) => {
          if (!exists) {
            resolve(this.currentUser.generateMasterKey());
          } else {
            reject(new UsernameAlreadyExistsError());
          }
        })
      )
      .then(() => this.currentUser.exportPrivateKey(password))
      .then((objectPrivateKey) => {
        privateKey = objectPrivateKey.privateKey;
        pass = objectPrivateKey.pass;
        pass.totp = false;
        pass.shortpass = false;

        return this.currentUser.exportOptions();
      })
      .then((rOptions) => {
        options = rOptions;
        return this.currentUser.exportPublicKey();
      })
      .then((publicKey) =>
        this.api.addUser(
          this.currentUser.username,
          privateKey,
          publicKey,
          pass,
          options
        )
      )
      .then(() => this.currentUser)
      .catch((err) => {
        const wrapper = new WrappingError(err);
        throw wrapper.error;
      });
  }

  loginUser(username, password, otp) {
    let key;
    let hash;
    let remoteUser;
    let parameters;
    return this.api.getDerivationParameters(username)
      .then((rParameters) => {
        parameters = rParameters;
        if (parameters.totp && (typeof otp === 'undefined' || otp === '')) {
          throw new NeedTOTPTokenError();
        }
        return derivePassword(password, parameters);
      })
      .then((dKey) => {
        hash = bytesToHexString(dKey.hash);
        key = dKey.key;
        return this.api.getUser(username, hash, otp);
      })
      .then((user) => {
        this.currentUser = new User(username);
        this.currentUser.totp = parameters.totp;
        this.currentUser.hash = hash;
        remoteUser = user;
        this.currentUser.keys = remoteUser.keys;
        return this.currentUser.importPublicKey(remoteUser.publicKey);
      })
      .then(() => this.currentUser.importPrivateKey(key, remoteUser.privateKey))
      .then(() => this.currentUser.decryptAllMetadatas(remoteUser.metadatas))
      .then(() => this.currentUser.importOptions(remoteUser.options))
      .then(() => this.currentUser)
      .catch((err) => {
        const wrapper = new WrappingError(err);
        throw wrapper.error;
      });
  }

  refreshUser() {
    return this.api.getUserWithSignature(this.currentUser)
      .then((user) => {
        this.currentUser.keys = user.keys;
        return this.currentUser.decryptAllMetadatas(user.metadatas);
      })
      .catch((err) => {
        const wrapper = new WrappingError(err);
        throw wrapper.error;
      });
  }

  addFolder(title) {
    return this.addSecret(title, {}, true);
  }

  addSecret(clearTitle, content, isFolder) {
    let hashedTitle;
    const now = new Date();
    const metadatas = {
      lastModifiedAt: now.toISOString(),
      lastModifiedBy: this.currentUser.username,
      users: {},
      title: clearTitle,
      type: 'secret',
    };
    if (isFolder) {
      metadatas.type = 'folder';
    }


    return new Promise((resolve, reject) => {
      metadatas.users[this.currentUser.username] = {
        username: this.currentUser.username,
        rights: 2,
        folders: {
          ROOT: true,
        },
      };
      if (typeof this.currentUser.username === 'string') {
        this.currentUser.createSecret(metadatas, content)
          .then((secretObject) => {
            hashedTitle = secretObject.hashedTitle;
            this.currentUser.keys[secretObject.hashedTitle] = {
              key: secretObject.wrappedKey,
              rights: metadatas.users[this.currentUser.username].rights,
            };
            this.currentUser.metadatas[secretObject.hashedTitle] = metadatas;
            return this.api.addSecret(this.currentUser, secretObject);
          })
          .then(() => {
            if (typeof this.currentUser.currentFolder !== 'undefined') {
              resolve(this.addSecretToFolder(hashedTitle, this.currentUser.currentFolder));
            } else {
              resolve(hashedTitle);
            }
          })
          .catch((err) => {
            const wrapper = new WrappingError(err);
            throw wrapper.error;
          });
      } else {
        reject(new DisconnectedError());
      }
    });
  }

  changePassword(password) {
    return this.currentUser.exportPrivateKey(password)
      .then((objectPrivateKey) =>
        this.api.editUser(
          this.currentUser,
          objectPrivateKey,
          'password'
        )
      )
      .catch((err) => {
        const wrapper = new WrappingError(err);
        throw wrapper.error;
      });
  }

  editSecret(hashedTitle, content) {
    return this.currentUser.editSecret(hashedTitle, content)
      .then((secretObject) => this.api.editSecret(this.currentUser, secretObject, hashedTitle))
      .catch((err) => {
        const wrapper = new WrappingError(err);
        throw wrapper.error;
      });
  }

  editOptions(options) {
    this.currentUser.options = options;
    return this.currentUser.exportOptions()
      .then((encryptedOptions) => this.api.editUser(this.currentUser, encryptedOptions, 'options'))
      .catch((err) => {
        const wrapper = new WrappingError(err);
        return wrapper.error;
      });
  }

  addSecretToFolder(hashedSecretTitle, hashedFolder) {
    let sharedSecretObjectsPromises = [];
    const folderMetadatas = this.currentUser.metadatas[hashedFolder];
    const secretMetadatas = this.currentUser.metadatas[hashedSecretTitle];
    Object.keys(folderMetadatas.users).forEach((friendName) => {
      sharedSecretObjectsPromises = sharedSecretObjectsPromises.concat(
        (() => {
          const friend = new User(friendName);
          return this.api.getPublicKey(friend.username)
            .then((publicKey) => friend.importPublicKey(publicKey))
            .then(() => this.getSharedSecretObjects(
              hashedSecretTitle,
              friend,
              folderMetadatas.users[friend.username].rights,
              []
            ));
        })()
      );
    });

    const metadatasUsers = {};
    const commonParentToClean = [];
    return Promise.all(sharedSecretObjectsPromises)
      .then((sharedSecretObjectsArray) => {
        const fullSharedSecretObjects = [];
        sharedSecretObjectsArray.forEach((sharedSecretObjects) => {
          sharedSecretObjects.forEach((sharedSecretObject) => {
            const newSharedSecretObject = sharedSecretObject;
            if (typeof metadatasUsers[newSharedSecretObject.hashedTitle] === 'undefined') {
              metadatasUsers[newSharedSecretObject.hashedTitle] = [];
            }
            metadatasUsers[newSharedSecretObject.hashedTitle].push({
              friendName: newSharedSecretObject.username,
              folder: newSharedSecretObject.inFolder,
            });
            delete newSharedSecretObject.inFolder;
            if (this.currentUser.username !== newSharedSecretObject.username) {
              delete newSharedSecretObject.username;
              fullSharedSecretObjects.push(newSharedSecretObject);
            }
          });
        });
        return this.api.shareSecret(this.currentUser, fullSharedSecretObjects);
      })
      .then(() => {
        const resetMetaPromises = [];
        Object.keys(folderMetadatas.users).forEach((username) => {
          Object.keys(folderMetadatas.users[username].folders).forEach((parentFolder) => {
            if (typeof secretMetadatas.users[username] !== 'undefined' &&
                typeof secretMetadatas.users[username].folders[parentFolder] !== 'undefined') {
              commonParentToClean.push(parentFolder);
            }
          });
        });

        Object.keys(metadatasUsers).forEach((hashedTitle) => {
          metadatasUsers[hashedTitle].forEach((infos) => {
            const currentSecret = this.currentUser.metadatas[hashedTitle];
            const metaUser = {
              username: infos.friendName,
              rights: folderMetadatas.users[infos.friendName].rights,
            };

            if (typeof currentSecret.users[infos.friendName] !== 'undefined') {
              metaUser.folders = currentSecret.users[infos.friendName].folders;
            } else {
              metaUser.folders = {};
            }

            if (typeof infos.folder !== 'undefined') {
              const parentMetadatas = this.currentUser.metadatas[infos.folder];
              metaUser.folders[infos.folder] = {
                name: parentMetadatas.title,
              };
            } else {
              metaUser.folders[hashedFolder] = {
                name: folderMetadatas.title,
              };
            }

            commonParentToClean.forEach((parentFolder) => {
              delete metaUser.folders[parentFolder];
            });

            if (infos.friendName === this.currentUser.username) {
              metaUser.rights = 2;
            }
            this.currentUser.metadatas[hashedTitle].users[infos.friendName] = metaUser;
          });

          resetMetaPromises.push(this.resetMetadatas(hashedTitle));
        });
        return Promise.all(resetMetaPromises);
      })
      .then(() => this.api.getSecret(hashedFolder, this.currentUser))
      .then((encryptedSecret) =>
        this.currentUser.decryptSecret(hashedFolder, encryptedSecret))
      .then((secret) => {
        const folders = JSON.parse(secret);
        folders[hashedSecretTitle] = 1;
        return this.editSecret(hashedFolder, folders);
      })
      .then(() => {
        const parentCleaningPromises = [];
        commonParentToClean.forEach((parentFolder) => {
          if (parentFolder !== 'ROOT') {
            parentCleaningPromises.push(
              this.api.getSecret(parentFolder, this.currentUser)
                .then((encryptedSecret) =>
                  this.currentUser.decryptSecret(parentFolder, encryptedSecret)
                )
                .then((secret) => {
                  const folders = JSON.parse(secret);
                  delete folders[hashedSecretTitle];
                  return this.editSecret(parentFolder, folders);
                })
            );
          }
        });
        return Promise.all(parentCleaningPromises);
      })
      .then(() => hashedSecretTitle)
      .catch((err) => {
        const wrapper = new WrappingError(err);
        throw wrapper.error;
      });
  }

  getSharedSecretObjects(hashedTitle, friend, rights, fullSharedSecretObjects, hashedFolder) {
    let isFolder = Promise.resolve();
    const sharedSecretObjectPromises = [];
    const secretMetadatas = this.currentUser.metadatas[hashedTitle];
    if (typeof (secretMetadatas) === 'undefined') {
      throw new DontHaveSecretError();
    } else {
      if (secretMetadatas.type === 'folder') {
        isFolder = isFolder
          .then(() => this.api.getSecret(hashedTitle, this.currentUser))
          .then((encryptedSecret) =>
            this.currentUser.decryptSecret(hashedTitle, encryptedSecret))
          .then((secrets) => {
            Object.keys(JSON.parse(secrets)).forEach((hash) => {
              sharedSecretObjectPromises.push(this.getSharedSecretObjects(
                hash,
                friend,
                rights,
                fullSharedSecretObjects,
                hashedTitle
              ));
            });
            return Promise.all(sharedSecretObjectPromises);
          });
      }

      return isFolder
        .then(() => this.currentUser.shareSecret(
          friend,
          this.currentUser.keys[hashedTitle].key,
          hashedTitle
        ))
        .then((secretObject) => {
          const newSecretObject = secretObject;
          newSecretObject.rights = rights;
          newSecretObject.inFolder = hashedFolder;
          newSecretObject.username = friend.username;
          fullSharedSecretObjects.push(newSecretObject);
          return fullSharedSecretObjects;
        })
        .catch((err) => {
          const wrapper = new WrappingError(err);
          throw wrapper.error;
        });
    }
  }

  resetMetadatas(hashedTitle) {
    const secretMetadatas = this.currentUser.metadatas[hashedTitle];
    const now = new Date();
    secretMetadatas.lastModifiedAt = now;
    secretMetadatas.lastModifiedBy = this.currentUser.username;
    return this.getSecret(hashedTitle)
      .then((secret) => this.editSecret(hashedTitle, secret))
      .catch((err) => {
        const wrapper = new WrappingError(err);
        throw wrapper.error;
      });
  }

  // this one should disappear
  shareFolder(hashedTitle, folderName) {
    return new Promise((resolve, reject) => {
      let hashedFolder = false;
      Object.keys(this.currentUser.metadatas).forEach((hash) => {
        const secretMetadatas = this.currentUser.metadatas[hash];
        if (secretMetadatas.type === 'folder'
            && secretMetadatas.title === folderName) {
          hashedFolder = hash;
        }
      });
      if (hashedFolder === false) {
        reject(new FolderNotFoundError());
      } else if (hashedTitle === hashedFolder) {
        reject(new FolderInItselfError());
      } else {
        resolve(this.addSecretToFolder(hashedTitle, hashedFolder));
      }
    });
  }
  //

  shareSecret(hashedTitle, friendName, rights) {
    let sharedSecretObjects;
    const friend = new User(friendName);
    return this.api.getPublicKey(friend.username)
      .then((publicKey) => friend.importPublicKey(publicKey),
            () => Promise.reject('Friend not found'))
      .then(() => this.getSharedSecretObjects(hashedTitle, friend, rights, []))
      .then((rSharedSecretObjects) => {
        sharedSecretObjects = rSharedSecretObjects;
        return this.api.shareSecret(this.currentUser, sharedSecretObjects);
      })
      .then(() => {
        const resetMetaPromises = [];
        sharedSecretObjects.forEach((sharedSecretObject) => {
          const secretMetadatas = this.currentUser.metadatas[sharedSecretObject.hashedTitle];
          secretMetadatas.users[friend.username] = {
            username: friend.username,
            rights,
            folders: {},
          };
          if (typeof sharedSecretObject.inFolder !== 'undefined') {
            const parentMetadatas = this.currentUser.metadatas[sharedSecretObject.inFolder];
            secretMetadatas.users[friend.username].folders[sharedSecretObject.inFolder] = {
              name: parentMetadatas.title,
            };
          } else {
            secretMetadatas.users[friend.username].folders.ROOT = true;
          }
          resetMetaPromises.push(this.resetMetadatas(sharedSecretObject.hashedTitle));
        });
        return Promise.all(resetMetaPromises);
      })
      .then(() => this.currentUser.metadatas[hashedTitle])
      .catch((err) => {
        const wrapper = new WrappingError(err);
        throw wrapper.error;
      });
  }

  unshareSecret(hashedTitle, friendName) {
    let isFolder = Promise.resolve();
    const secretMetadatas = this.currentUser.metadatas[hashedTitle];
    if (typeof (secretMetadatas) === 'undefined') {
      return Promise.reject(new DontHaveSecretError());
    }
    if (secretMetadatas.type === 'folder') {
      isFolder = isFolder
        .then(() => this.unshareFolderSecrets(hashedTitle, friendName));
    }

    return isFolder
      .then(() => this.api.unshareSecret(this.currentUser, [friendName], hashedTitle))
      .then((result) => {
        if (result !== 'Secret unshared') {
          const wrapper = new WrappingError(result);
          throw wrapper.error;
        }
        delete secretMetadatas.users[friendName];
        return this.resetMetadatas(hashedTitle);
      })
      .then(() => this.renewKey(hashedTitle))
      .then(() => this.currentUser.metadatas[hashedTitle])
      .catch((err) => {
        const wrapper = new WrappingError(err);
        throw wrapper.error;
      });
  }

  unshareFolderSecrets(hashedFolder, friendName) {
    return this.api.getSecret(hashedFolder, this.currentUser)
      .then((encryptedSecret) =>
        this.currentUser.decryptSecret(hashedFolder, encryptedSecret))
      .then((secrets) =>
        Object.keys(JSON.parse(secrets)).reduce(
          (promise, hashedTitle) =>
            promise.then(() => this.unshareSecret(hashedTitle, friendName))
          , Promise.resolve()
        )
      )
      .catch((err) => {
        const wrapper = new WrappingError(err);
        throw wrapper.error;
      });
  }

  wrapKeyForFriend(hashedUsername, key) {
    let friend;
    return this.api.getPublicKey(hashedUsername, true)
      .then((publicKey) => {
        friend = new User(hashedUsername);
        return friend.importPublicKey(publicKey);
      })
      .then(() => this.currentUser.wrapKey(key, friend.publicKey))
      .then((friendWrappedKey) => ({ user: hashedUsername, key: friendWrappedKey }))
      .catch((err) => {
        const wrapper = new WrappingError(err);
        throw wrapper.error;
      });
  }

  renewKey(hashedTitle) {
    let encryptedSecret;
    const secret = {};
    let hashedCurrentUsername;
    let wrappedKeys;
    return this.api.getSecret(hashedTitle, this.currentUser)
      .then((eSecret) => {
        encryptedSecret = eSecret;
        return this.currentUser.decryptSecret(hashedTitle, encryptedSecret);
      })
      .then((rawSecret) =>
        this.currentUser.encryptSecret(
          this.currentUser.metadatas[hashedTitle],
          JSON.parse(rawSecret)
        ))
      .then((secretObject) => {
        secret.secret = secretObject.secret;
        secret.iv = secretObject.iv;
        secret.metadatas = secretObject.metadatas;
        secret.iv_meta = secretObject.iv_meta;
        hashedCurrentUsername = secretObject.hashedUsername;
        const wrappedKeysPromises = [];
        encryptedSecret.users.forEach((hashedUsername) => {
          if (hashedCurrentUsername === hashedUsername) {
            wrappedKeysPromises.push(
              this.currentUser.wrapKey(secretObject.key, this.currentUser.publicKey)
                .then((wrappedKey) => ({ user: hashedCurrentUsername, key: wrappedKey }))
            );
          } else {
            wrappedKeysPromises.push(this.wrapKeyForFriend(hashedUsername, secretObject.key));
          }
        });

        return Promise.all(wrappedKeysPromises);
      })
      .then((rWrappedKeys) => {
        wrappedKeys = rWrappedKeys;
        return this.api.newKey(this.currentUser, hashedTitle, secret, wrappedKeys);
      })
      .then(() => {
        wrappedKeys.forEach((wrappedKey) => {
          if (wrappedKey.user === hashedCurrentUsername) {
            this.currentUser.keys[hashedTitle].key = wrappedKey.key;
          }
        });
      })
      .catch((err) => {
        const wrapper = new WrappingError(err);
        throw wrapper.error;
      });
  }

  removeSecretFromFolder(hashedTitle, hashedFolder) {
    const secretMetadatas = this.currentUser.metadatas[hashedTitle];
    const usersToDelete = [];
    Object.keys(secretMetadatas.users).forEach((username) => {
      if (typeof secretMetadatas.users[username].folders[hashedFolder] !== 'undefined') {
        usersToDelete.push(username);
      }
    });
    return this.api.unshareSecret(this.currentUser, usersToDelete, hashedTitle)
      .then(() => {
        usersToDelete.forEach((username) => {
          delete secretMetadatas.users[username].folders[hashedFolder];
          if (Object.keys(secretMetadatas.users[username].folders).length === 0) {
            if (this.currentUser.username === username) {
              secretMetadatas.users[username].folders.ROOT = true;
            } else {
              delete secretMetadatas.users[username];
            }
          }
        });
        return this.renewKey(hashedTitle);
      })
      .then(() => this.resetMetadatas(hashedTitle))
      .then(() => this.api.getSecret(hashedFolder, this.currentUser))
      .then((encryptedSecret) =>
        this.currentUser.decryptSecret(hashedFolder, encryptedSecret))
      .then((secret) => {
        const folder = JSON.parse(secret);
        delete folder[hashedTitle];
        return this.editSecret(hashedFolder, folder);
      })
      .catch((err) => {
        const wrapper = new WrappingError(err);
        throw wrapper.error;
      });
  }

  getSecret(hashedTitle) {
    return this.api.getSecret(hashedTitle, this.currentUser)
      .then((encryptedSecret) =>
        this.currentUser.decryptSecret(hashedTitle, encryptedSecret))
      .then((secret) => JSON.parse(secret))
      .catch((err) => {
        const wrapper = new WrappingError(err);
        throw wrapper.error;
      });
  }

  deleteSecret(hashedTitle, list = []) {
    let isFolder = Promise.resolve();
    const secretMetadatas = this.currentUser.metadatas[hashedTitle];
    if (typeof (secretMetadatas) === 'undefined') {
      return Promise.reject(new DontHaveSecretError());
    }
    if (secretMetadatas.type === 'folder' && list.indexOf(hashedTitle) === -1) {
      isFolder = isFolder
        .then(() => this.deleteFolderSecrets(hashedTitle, list));
    }

    return isFolder
    .then(() => this.api.deleteSecret(this.currentUser, hashedTitle))
    .then(() => {
      delete this.currentUser.metadatas[hashedTitle];
      delete this.currentUser.keys[hashedTitle];
      const editFolderPromises = [];
      const currentUsername = this.currentUser.username;
      Object.keys(secretMetadatas.users[currentUsername].folders).forEach((hashedFolder) => {
        if (hashedFolder !== 'ROOT') {
          editFolderPromises.push(
            this.api.getSecret(hashedFolder, this.currentUser)
              .then((encryptedSecret) =>
                this.currentUser.decryptSecret(hashedFolder, encryptedSecret))
              .then((secret) => {
                const folder = JSON.parse(secret);
                delete folder[hashedTitle];
                return this.editSecret(hashedFolder, folder);
              })
          );
        }
      });
      return Promise.all(editFolderPromises);
    })
    .catch((err) => {
      const wrapper = new WrappingError(err);
      throw wrapper.error;
    });
  }

  deleteFolderSecrets(hashedFolder, list) {
    list.push(hashedFolder);
    return this.api.getSecret(hashedFolder, this.currentUser)
      .then((encryptedSecret) =>
        this.currentUser.decryptSecret(hashedFolder, encryptedSecret))
      .then((secrets) =>
        Object.keys(JSON.parse(secrets)).reduce(
          (promise, hashedTitle) =>
            promise.then(() =>
              this.deleteSecret(hashedTitle, list))
          , Promise.resolve()
        )
      )
      .catch((err) => {
        const wrapper = new WrappingError(err);
        throw wrapper.error;
      });
  }

  activateTotp(seed) {
    const protectedSeed = xorSeed(hexStringToUint8Array(this.currentUser.hash), seed.raw);
    return this.api.activateTotp(bytesToHexString(protectedSeed), this.currentUser)
      .catch((err) => {
        const wrapper = new WrappingError(err);
        throw wrapper.error;
      });
  }

  activateShortpass(shortpass, deviceName) {
    if (localStorageAvailable()) {
      return this.currentUser.activateShortpass(shortpass, deviceName)
        .then((toSend) => this.api.activateShortpass(toSend, this.currentUser))
        .catch((err) => {
          const wrapper = new WrappingError(err);
          throw wrapper.error;
        });
    }
    return Promise.reject(new LocalStorageUnavailableError());
  }

  shortLogin(shortpass) {
    const username = localStorage.getItem(`${Secretin.prefix}username`);
    const deviceName = localStorage.getItem(`${Secretin.prefix}deviceName`);
    let shortpassKey;
    let parameters;
    this.currentUser = new User(username);
    return this.api.getProtectKeyParameters(username, deviceName)
      .then((rParameters) => {
        parameters = rParameters;
        this.currentUser.totp = parameters.totp;
        return this.currentUser.importPublicKey(parameters.publicKey);
      })
      .then(() => derivePassword(shortpass, parameters))
      .then((dKey) => {
        shortpassKey = dKey.key;
        return this.api.getProtectKey(username, deviceName, bytesToHexString(dKey.hash));
      })
      .then((protectKey) => this.currentUser.shortLogin(shortpassKey, protectKey))
      .then(() => this.refreshUser())
      .then(() => this.currentUser)
      .catch((err) => {
        localStorage.removeItem(`${Secretin.prefix}username`);
        localStorage.removeItem(`${Secretin.prefix}deviceName`);
        localStorage.removeItem(`${Secretin.prefix}privateKey`);
        localStorage.removeItem(`${Secretin.prefix}privateKeyIv`);
        localStorage.removeItem(`${Secretin.prefix}iv`);
        const wrapper = new WrappingError(err);
        throw wrapper.error;
      });
  }

  canITryShortpass() {
    return (localStorageAvailable() && localStorage.getItem(`${Secretin.prefix}username`) !== null);
  }
}

Object.defineProperty(Secretin, 'prefix', {
  value: 'Secret-in:',
  writable: false,
  enumerable: true,
  configurable: false,
});

export default Secretin;
