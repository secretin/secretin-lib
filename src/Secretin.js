import {
  WrappingError,
  UsernameAlreadyExistsError,
  NeedTOTPTokenError,
  DontHaveSecretError,
  OfflineError,
  LocalStorageUnavailableError,
  NotAvailableError,
} from './Errors';

import {
  hexStringToUint8Array,
  localStorageAvailable,
  xorSeed,
} from './lib/utils';

import APIStandalone from './API/Standalone';
import User from './User';

class Secretin {
  constructor(cryptoAdapter, API = APIStandalone, db) {
    this.cryptoAdapter = cryptoAdapter;
    this.api = new API(db, this.cryptoAdapter.getSHA256);
    this.editableDB = true;
    this.currentUser = {};
    this.listeners = {
      connectionChange: [],
    };
  }

  addEventListener(event, callback) {
    this.listeners[event].push(callback);
  }

  removeEventListener(event, callback) {
    const callbackIndex = this.listeners[event].indexOf(callback);
    this.listeners[event].splice(callbackIndex, 1);
  }

  dispatchEvent(event, eventArgs) {
    this.listeners[event].map(callback => callback(eventArgs));
  }

  offlineDB(username) {
    if (this.editableDB) {
      const cacheKey = `${Secretin.prefix}cache_${username || this.currentUser.username}`;
      const DbCacheStr = localStorage.getItem(cacheKey);
      const DbCache = DbCacheStr ? JSON.parse(DbCacheStr) : { users: {}, secrets: {} };
      this.oldApi = this.api;
      this.api = new APIStandalone(DbCache, this.cryptoAdapter.getSHA256);
      this.editableDB = false;
      this.dispatchEvent('connectionChange', { connection: 'offline' });
      this.testOnline();
    }
  }

  testOnline() {
    setTimeout(() => {
      this.oldApi.isOnline()
        .then(() => {
          this.api = this.oldApi;
          this.editableDB = true;
          this.dispatchEvent('connectionChange', { connection: 'online' });
          if (typeof this.currentUser.username !== 'undefined') {
            this.getDb().then(() => this.doCacheActions());
          }
        })
        .catch((err) => {
          if (err === 'Offline') {
            this.testOnline();
          } else {
            throw err;
          }
        });
    }, 10000);
  }

  pushCacheAction(action, args) {
    const cacheActionsKey = `${Secretin.prefix}cacheActions_${this.currentUser.username}`;
    const cacheActionsStr = localStorage.getItem(cacheActionsKey);
    const cacheActions = cacheActionsStr ? JSON.parse(cacheActionsStr) : [];
    cacheActions.push({
      action,
      args,
    });

    localStorage.setItem(cacheActionsKey, JSON.stringify(cacheActions));
  }

  doCacheActions() {
    const cacheActionsKey = `${Secretin.prefix}cacheActions_${this.currentUser.username}`;
    let cacheActionsStr = localStorage.getItem(cacheActionsKey);
    const cacheActions = cacheActionsStr ? JSON.parse(cacheActionsStr) : [];
    let updatedCacheActions;
    return cacheActions.reduce((promise, cacheAction) => {
      if (cacheAction.action === 'addSecret') {
        return promise.then(() =>
          this.api.addSecret(this.currentUser, cacheAction.args[0])
            .then(() => {
              cacheActionsStr = localStorage.getItem(cacheActionsKey);
              updatedCacheActions = JSON.parse(cacheActionsStr);
              updatedCacheActions.shift();
              return localStorage.setItem(cacheActionsKey, JSON.stringify(updatedCacheActions));
            })
        );
      } else if (cacheAction.action === 'editSecret') {
        return promise.then(() =>
          this.cryptoAdapter.decryptRSAOAEP(cacheAction.args[2], this.currentUser.privateKey)
            .then((metadatas) => {
              this.currentUser.metadatas[cacheAction.args[0]] = metadatas;
              return this.cryptoAdapter.decryptRSAOAEP(
                cacheAction.args[1],
                this.currentUser.privateKey
              );
            })
            .then(content => this.editSecret(cacheAction.args[0], content))
            .then(() => {
              cacheActionsStr = localStorage.getItem(cacheActionsKey);
              updatedCacheActions = JSON.parse(cacheActionsStr);
              updatedCacheActions.shift();
              return localStorage.setItem(cacheActionsKey, JSON.stringify(updatedCacheActions));
            })
        );
      }
      return promise;
    }, Promise.resolve());
  }

  newUser(username, password) {
    if (!this.editableDB) {
      return Promise.reject(new OfflineError());
    }
    let privateKey;
    let pass;
    let options;
    this.currentUser = new User(username, this.cryptoAdapter);
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
      .then(() => {
        if (typeof window.process !== 'undefined') {
          // Electron
          this.getDb();
        }
        return this.currentUser;
      })
      .catch((err) => {
        if (err === 'Offline') {
          this.offlineDB();
        }
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
        return this.cryptoAdapter.derivePassword(password, parameters);
      })
      .then((dKey) => {
        hash = dKey.hash;
        key = dKey.key;
        return this.api.getUser(username, hash, otp);
      })
      .then((user) => {
        this.currentUser = new User(username, this.cryptoAdapter);
        this.currentUser.totp = parameters.totp;
        this.currentUser.hash = hash;
        remoteUser = user;
        this.currentUser.keys = remoteUser.keys;
        return this.currentUser.importPublicKey(remoteUser.publicKey);
      })
      .then(() => this.currentUser.importPrivateKey(key, remoteUser.privateKey))
      .then(() => this.currentUser.decryptAllMetadatas(remoteUser.metadatas))
      .then(() => this.currentUser.importOptions(remoteUser.options))
      .then(() => {
        if (typeof window.process !== 'undefined') {
          // Electron
          return this.getDb().then(() => {
            if (this.editableDB) {
              return this.doCacheActions();
            }
            return Promise.resolve();
          });
        }
        return Promise.resolve();
      })
      .then(() => this.currentUser)
      .catch((err) => {
        if (err === 'Offline') {
          this.offlineDB(username);
          return this.loginUser(username, password, otp);
        }
        const wrapper = new WrappingError(err);
        throw wrapper.error;
      });
  }

  refreshUser() {
    return this.api.getUserWithSignature(this.currentUser)
      .then((user) => {
        this.currentUser.keys = user.keys;
        if (typeof window.process !== 'undefined') {
          // Electron
          this.getDb();
        }
        return this.currentUser.decryptAllMetadatas(user.metadatas);
      })
      .catch((err) => {
        if (err === 'Offline') {
          this.offlineDB();
          return this.refreshUser();
        }
        const wrapper = new WrappingError(err);
        throw wrapper.error;
      });
  }

  addFolder(title, inFolderId) {
    return this.addSecret(title, {}, inFolderId, 'folder');
  }

  addSecret(clearTitle, content, inFolderId, type = 'secret') {
    let hashedTitle;
    const now = new Date();
    const metadatas = {
      lastModifiedAt: now.toISOString(),
      lastModifiedBy: this.currentUser.username,
      users: {},
      title: clearTitle,
      type,
    };

    metadatas.users[this.currentUser.username] = {
      username: this.currentUser.username,
      rights: 2,
      folders: {},
    };
    if (typeof inFolderId === 'undefined') {
      metadatas.users[this.currentUser.username].folders.ROOT = true;
    }

    return this.currentUser.createSecret(metadatas, content)
      .then((secretObject) => {
        hashedTitle = secretObject.hashedTitle;
        this.currentUser.keys[secretObject.hashedTitle] = {
          key: secretObject.wrappedKey,
          rights: metadatas.users[this.currentUser.username].rights,
        };
        if (!this.editableDB) {
          this.pushCacheAction('addSecret', [secretObject]);
        }
        return this.api.addSecret(this.currentUser, secretObject);
      })
      .then(() => {
        this.currentUser.metadatas[hashedTitle] = metadatas;
        if (typeof inFolderId !== 'undefined') {
          return this.addSecretToFolder(hashedTitle, inFolderId);
        }
        return Promise.resolve(hashedTitle);
      })
      .then((res) => {
        if (typeof window.process !== 'undefined') {
          // Electron
          this.getDb();
        }
        return res;
      })
      .catch((err) => {
        if (err === 'Offline') {
          this.offlineDB();
          return this.addSecret(clearTitle, content, inFolderId, type);
        }
        const wrapper = new WrappingError(err);
        throw wrapper.error;
      });
  }

  changePassword(password) {
    if (!this.editableDB) {
      return Promise.reject(new OfflineError());
    }
    return this.currentUser.exportPrivateKey(password)
      .then((objectPrivateKey) =>
        this.api.editUser(
          this.currentUser,
          objectPrivateKey,
          'password'
        )
      )
      .then((res) => {
        if (typeof window.process !== 'undefined') {
          // Electron
          this.getDb();
        }
        return res;
      })
      .catch((err) => {
        if (err === 'Offline') {
          this.offlineDB();
        }
        const wrapper = new WrappingError(err);
        throw wrapper.error;
      });
  }

  editSecret(hashedTitle, content) {
    return this.currentUser.editSecret(hashedTitle, content)
      .then((secretObject) => {
        if (!this.editableDB) {
          if (Object.keys(this.currentUser.metadatas[hashedTitle].users).length > 1) {
            return Promise.reject(new OfflineError());
          }
          const args = [hashedTitle];
          this.cryptoAdapter.encryptRSAOAEP(content, this.currentUser.publicKey)
            .then((encryptedContent) => {
              args.push(encryptedContent);
              return this.cryptoAdapter.encryptRSAOAEP(
                this.currentUser.metadatas[hashedTitle], this.currentUser.publicKey);
            })
            .then((encryptedMetadatas) => {
              args.push(encryptedMetadatas);
              return this.pushCacheAction('editSecret', args);
            });
        }
        return this.api.editSecret(this.currentUser, secretObject, hashedTitle);
      })
      .then((res) => {
        if (typeof window.process !== 'undefined') {
          // Electron
          this.getDb();
        }
        return res;
      })
      .catch((err) => {
        if (err === 'Offline') {
          this.offlineDB();
          return this.editSecret(hashedTitle, content);
        }
        const wrapper = new WrappingError(err);
        throw wrapper.error;
      });
  }

  editOption(name, value) {
    if (!this.editableDB) {
      return Promise.reject(new OfflineError());
    }
    this.currentUser.options[name] = value;
    return this.resetOptions();
  }

  editOptions(options) {
    if (!this.editableDB) {
      return Promise.reject(new OfflineError());
    }
    this.currentUser.options = options;
    return this.resetOptions();
  }

  resetOptions() {
    if (!this.editableDB) {
      return Promise.reject(new OfflineError());
    }
    return this.currentUser.exportOptions()
      .then((encryptedOptions) => this.api.editUser(this.currentUser, encryptedOptions, 'options'))
      .then((res) => {
        if (typeof window.process !== 'undefined') {
          // Electron
          this.getDb();
        }
        return res;
      })
      .catch((err) => {
        if (err === 'Offline') {
          this.offlineDB();
        }
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
          const friend = new User(friendName, this.cryptoAdapter);
          return this.api.getPublicKey(friend.username)
            .then((publicKey) => friend.importPublicKey(publicKey))
            .then(() => this.getSharedSecretObjects(
              hashedSecretTitle,
              friend,
              folderMetadatas.users[friend.username].rights,
              [],
              true
            ));
        })()
      );
    });

    const metadatasUsers = {};
    const commonParentToClean = [];
    return this.api.getSecret(hashedFolder, this.currentUser)
      .then((encryptedSecret) =>
        this.currentUser.decryptSecret(hashedFolder, encryptedSecret))
      .then((secret) => {
        const folders = secret;
        folders[hashedSecretTitle] = 1;
        return this.editSecret(hashedFolder, folders);
      })
      .then(() => Promise.all(sharedSecretObjectsPromises))
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
        if (fullSharedSecretObjects.length > 0) {
          if (!this.editableDB) {
            return Promise.reject(new OfflineError());
          }
          return this.api.shareSecret(this.currentUser, fullSharedSecretObjects);
        }
        return Promise.resolve();
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
                  const folders = secret;
                  delete folders[hashedSecretTitle];
                  return this.editSecret(parentFolder, folders);
                })
            );
          }
        });
        return Promise.all(parentCleaningPromises);
      })
      .then(() => hashedSecretTitle)
      .then((res) => {
        if (typeof window.process !== 'undefined') {
          // Electron
          this.getDb();
        }
        return res;
      })
      .catch((err) => {
        if (err === 'Offline') {
          this.offlineDB();
          return this.addSecretToFolder(hashedSecretTitle, hashedFolder);
        }
        const wrapper = new WrappingError(err);
        throw wrapper.error;
      });
  }

  getSharedSecretObjects(hashedTitle, friend, rights, fullSharedSecretObjects, addUsername = false,
    hashedFolder) {
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
            Object.keys(secrets).forEach((hash) => {
              sharedSecretObjectPromises.push(this.getSharedSecretObjects(
                hash,
                friend,
                rights,
                fullSharedSecretObjects,
                addUsername,
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
          if (addUsername) {
            newSecretObject.username = friend.username;
          }
          fullSharedSecretObjects.push(newSecretObject);
          return fullSharedSecretObjects;
        })
        .catch((err) => {
          if (err === 'Offline') {
            this.offlineDB();
            throw err;
          } else {
            const wrapper = new WrappingError(err);
            throw wrapper.error;
          }
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
      .then((res) => {
        if (typeof window.process !== 'undefined') {
          // Electron
          this.getDb();
        }
        return res;
      })
      .catch((err) => {
        if (err === 'Offline') {
          this.offlineDB();
        }
        const wrapper = new WrappingError(err);
        throw wrapper.error;
      });
  }

  shareSecret(hashedTitle, friendName, sRights) {
    if (!this.editableDB) {
      return Promise.reject(new OfflineError());
    }
    let sharedSecretObjects;
    const rights = parseInt(sRights, 10);
    const friend = new User(friendName, this.cryptoAdapter);
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
      .then((res) => {
        if (typeof window.process !== 'undefined') {
          // Electron
          this.getDb();
        }
        return res;
      })
      .catch((err) => {
        if (err === 'Offline') {
          this.offlineDB();
        }
        const wrapper = new WrappingError(err);
        throw wrapper.error;
      });
  }

  unshareSecret(hashedTitle, friendName) {
    if (!this.editableDB) {
      return Promise.reject(new OfflineError());
    }
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
      .then((res) => {
        if (typeof window.process !== 'undefined') {
          // Electron
          this.getDb();
        }
        return res;
      })
      .catch((err) => {
        if (err === 'Offline') {
          this.offlineDB();
        }
        const wrapper = new WrappingError(err);
        throw wrapper.error;
      });
  }

  unshareFolderSecrets(hashedFolder, friendName) {
    if (!this.editableDB) {
      return Promise.reject(new OfflineError());
    }
    return this.api.getSecret(hashedFolder, this.currentUser)
      .then((encryptedSecret) =>
        this.currentUser.decryptSecret(hashedFolder, encryptedSecret))
      .then((secrets) =>
        Object.keys(secrets).reduce(
          (promise, hashedTitle) =>
            promise.then(() => this.unshareSecret(hashedTitle, friendName))
          , Promise.resolve()
        )
      )
      .then((res) => {
        if (typeof window.process !== 'undefined') {
          // Electron
          this.getDb();
        }
        return res;
      })
      .catch((err) => {
        if (err === 'Offline') {
          this.offlineDB();
        }
        const wrapper = new WrappingError(err);
        throw wrapper.error;
      });
  }

  wrapKeyForFriend(hashedUsername, key) {
    if (!this.editableDB) {
      return Promise.reject(new OfflineError());
    }
    let friend;
    return this.api.getPublicKey(hashedUsername, true)
      .then((publicKey) => {
        friend = new User(hashedUsername, this.cryptoAdapter);
        return friend.importPublicKey(publicKey);
      })
      .then(() => this.currentUser.wrapKey(key, friend.publicKey))
      .then((friendWrappedKey) => ({ user: hashedUsername, key: friendWrappedKey }))
      .catch((err) => {
        if (err === 'Offline') {
          this.offlineDB();
          throw err;
        }
        const wrapper = new WrappingError(err);
        throw wrapper.error;
      });
  }

  renewKey(hashedTitle) {
    if (!this.editableDB) {
      return Promise.reject(new OfflineError());
    }
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
          rawSecret
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
      .then((res) => {
        if (typeof window.process !== 'undefined') {
          // Electron
          this.getDb();
        }
        return res;
      })
      .catch((err) => {
        if (err === 'Offline') {
          this.offlineDB();
        }
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

    return Promise.resolve()
      .then(() => {
        if (usersToDelete.length > 1) {
          if (!this.editableDB) {
            return Promise.reject(new OfflineError());
          }
          return this.api.unshareSecret(this.currentUser, usersToDelete, hashedTitle);
        }
        return Promise.resolve();
      })
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
        if (usersToDelete.length > 1) {
          return this.renewKey(hashedTitle);
        }
        return Promise.resolve();
      })
      .then(() => this.resetMetadatas(hashedTitle))
      .then(() => this.api.getSecret(hashedFolder, this.currentUser))
      .then((encryptedSecret) =>
        this.currentUser.decryptSecret(hashedFolder, encryptedSecret))
      .then((secret) => {
        const folder = secret;
        delete folder[hashedTitle];
        return this.editSecret(hashedFolder, folder);
      })
      .then((res) => {
        if (typeof window.process !== 'undefined') {
          // Electron
          this.getDb();
        }
        return res;
      })
      .catch((err) => {
        if (err === 'Offline') {
          this.offlineDB();
          return this.removeSecretFromFolder(hashedTitle, hashedFolder);
        }
        const wrapper = new WrappingError(err);
        throw wrapper.error;
      });
  }

  getSecret(hashedTitle) {
    return this.api.getSecret(hashedTitle, this.currentUser)
      .then((encryptedSecret) =>
        this.currentUser.decryptSecret(hashedTitle, encryptedSecret))
      .then((secret) => secret)
      .catch((err) => {
        if (err === 'Offline') {
          this.offlineDB();
          return this.getSecret(hashedTitle);
        }
        const wrapper = new WrappingError(err);
        throw wrapper.error;
      });
  }

  deleteSecret(hashedTitle, list = []) {
    if (!this.editableDB) {
      return Promise.reject(new OfflineError());
    }
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
                  const folder = secret;
                  delete folder[hashedTitle];
                  return this.editSecret(hashedFolder, folder);
                })
            );
          }
        });
        return Promise.all(editFolderPromises);
      })
      .then((res) => {
        if (typeof window.process !== 'undefined') {
          // Electron
          this.getDb();
        }
        return res;
      })
      .catch((err) => {
        if (err === 'Offline') {
          this.offlineDB();
        }
        const wrapper = new WrappingError(err);
        throw wrapper.error;
      });
  }

  deleteFolderSecrets(hashedFolder, list) {
    if (!this.editableDB) {
      return Promise.reject(new OfflineError());
    }
    list.push(hashedFolder);
    return this.api.getSecret(hashedFolder, this.currentUser)
      .then((encryptedSecret) =>
        this.currentUser.decryptSecret(hashedFolder, encryptedSecret))
      .then((secrets) =>
        Object.keys(secrets).reduce(
          (promise, hashedTitle) =>
            promise.then(() =>
              this.deleteSecret(hashedTitle, list))
          , Promise.resolve()
        )
      )
      .then((res) => {
        if (typeof window.process !== 'undefined') {
          // Electron
          this.getDb();
        }
        return res;
      })
      .catch((err) => {
        if (err === 'Offline') {
          this.offlineDB();
        }
        const wrapper = new WrappingError(err);
        throw wrapper.error;
      });
  }

  deactivateTotp() {
    if (!this.editableDB) {
      return Promise.reject(new OfflineError());
    }
    return this.api.deactivateTotp(this.currentUser)
      .then((res) => {
        if (typeof window.process !== 'undefined') {
          // Electron
          this.getDb();
        }
        return res;
      })
      .catch((err) => {
        if (err === 'Offline') {
          this.offlineDB();
        }
        const wrapper = new WrappingError(err);
        throw wrapper.error;
      });
  }

  activateTotp(seed) {
    if (!this.editableDB) {
      return Promise.reject(new OfflineError());
    }
    const protectedSeed = xorSeed(hexStringToUint8Array(this.currentUser.hash), seed.raw);
    return this.api.activateTotp(protectedSeed, this.currentUser)
      .then((res) => {
        if (typeof window.process !== 'undefined') {
          // Electron
          this.getDb();
        }
        return res;
      })
      .catch((err) => {
        if (err === 'Offline') {
          this.offlineDB();
        }
        const wrapper = new WrappingError(err);
        throw wrapper.error;
      });
  }

  activateShortLogin(shortpass, deviceName) {
    if (!this.editableDB) {
      return Promise.reject(new OfflineError());
    }
    if (localStorageAvailable()) {
      return this.currentUser.activateShortLogin(shortpass, deviceName)
        .then((toSend) => this.api.activateShortLogin(toSend, this.currentUser))
        .then((res) => {
          if (typeof window.process !== 'undefined') {
            // Electron
            this.getDb();
          }
          return res;
        })
        .catch((err) => {
          if (err === 'Offline') {
            this.offlineDB();
          }
          const wrapper = new WrappingError(err);
          throw wrapper.error;
        });
    }
    return Promise.reject(new LocalStorageUnavailableError());
  }

  deactivateShortLogin() {
    if (localStorageAvailable()) {
      localStorage.removeItem(`${Secretin.prefix}username`);
      localStorage.removeItem(`${Secretin.prefix}deviceName`);
      localStorage.removeItem(`${Secretin.prefix}privateKey`);
      localStorage.removeItem(`${Secretin.prefix}privateKeyIv`);
      localStorage.removeItem(`${Secretin.prefix}iv`);
      return Promise.resolve();
    }
    return Promise.reject(new LocalStorageUnavailableError());
  }

  shortLogin(shortpass) {
    const username = localStorage.getItem(`${Secretin.prefix}username`);
    const deviceName = localStorage.getItem(`${Secretin.prefix}deviceName`);
    let shortpassKey;
    let parameters;
    this.currentUser = new User(username, this.cryptoAdapter);
    return this.api.getProtectKeyParameters(username, deviceName)
      .then((rParameters) => {
        parameters = rParameters;
        this.currentUser.totp = parameters.totp;
        return this.currentUser.importPublicKey(parameters.publicKey);
      })
      .then(() => this.cryptoAdapter.derivePassword(shortpass, parameters))
      .then((dKey) => {
        shortpassKey = dKey.key;
        return this.api.getProtectKey(username, deviceName, dKey.hash);
      })
      .then((protectKey) => this.currentUser.shortLogin(shortpassKey, protectKey))
      .then(() => this.refreshUser())
      .then(() => {
        if (typeof window.process !== 'undefined') {
          // Electron
          return this.getDb().then(() => {
            if (this.editableDB) {
              return this.doCacheActions();
            }
            return Promise.resolve();
          });
        }
        return Promise.resolve();
      })
      .then(() => this.currentUser)
      .catch((err) => {
        if (err === 'Offline') {
          this.offlineDB();
          return this.shortLogin(shortpass);
        }
        if (err !== 'Not available in standalone mode' && !(err instanceof NotAvailableError)) {
          localStorage.removeItem(`${Secretin.prefix}username`);
          localStorage.removeItem(`${Secretin.prefix}deviceName`);
          localStorage.removeItem(`${Secretin.prefix}privateKey`);
          localStorage.removeItem(`${Secretin.prefix}privateKeyIv`);
          localStorage.removeItem(`${Secretin.prefix}iv`);
        }
        const wrapper = new WrappingError(err);
        throw wrapper.error;
      });
  }

  canITryShortLogin() {
    return (
      this.editableDB &&
      localStorageAvailable() &&
      localStorage.getItem(`${Secretin.prefix}username`) !== null
    );
  }

  getSavedUsername() {
    if (this.canITryShortLogin()) {
      return localStorage.getItem(`${Secretin.prefix}username`);
    }
    return null;
  }

  getRescueCodes() {
    return this.api.getRescueCodes(this.currentUser)
      .catch((err) => {
        if (err === 'Offline') {
          this.offlineDB();
          return this.getRescueCodes();
        }
        const wrapper = new WrappingError(err);
        throw wrapper.error;
      });
  }

  getDb() {
    const cacheKey = `${Secretin.prefix}cache_${this.currentUser.username}`;
    const DbCacheStr = localStorage.getItem(cacheKey);
    const DbCache = DbCacheStr ? JSON.parse(DbCacheStr) : { users: {}, secrets: {} };
    const revs = {};
    Object.keys(DbCache.secrets).forEach((key) => {
      revs[key] = DbCache.secrets[key].rev;
    });
    return this.api.getDb(this.currentUser, revs)
      .then((newDb) => {
        Object.assign(DbCache.users, newDb.users);
        Object.assign(DbCache.secrets, newDb.secrets);
        Object.keys(DbCache.secrets).forEach((key) => {
          if (!DbCache.secrets[key]) {
            delete DbCache.secrets[key];
          }
        });
        const newDbCacheStr = JSON.stringify(DbCache);
        localStorage.setItem(cacheKey, JSON.stringify(DbCache));
        return newDbCacheStr;
      })
      .catch((err) => {
        if (err === 'Offline') {
          this.offlineDB();
          return this.getDb();
        }
        const wrapper = new WrappingError(err);
        throw wrapper.error;
      });
  }
}

Object.defineProperty(Secretin, 'prefix', {
  value: 'Secret-in:',
  writable: false,
  enumerable: true,
  configurable: false,
});

export default Secretin;
