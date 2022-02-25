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
  GetDerivationStatus,
  PasswordDerivationStatus,
  GetUserStatus,
  ImportPublicKeyStatus,
  DecryptPrivateKeyStatus,
  DecryptUserOptionsStatus,
  DecryptMetadataCacheStatus,
  EndDecryptMetadataStatus,
  GetProtectKeyStatus,
  ImportSecretStatus,
} from './Statuses';

import {
  hexStringToUint8Array,
  localStorageAvailable,
  xorSeed,
  defaultProgress,
  SecretinPrefix,
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
    this.listeners[event].map((callback) => callback(eventArgs));
  }

  offlineDB(username) {
    if (this.editableDB) {
      const cacheKey = `${SecretinPrefix}cache_${
        username || this.currentUser.username
      }`;
      const DbCacheStr = localStorage.getItem(cacheKey);
      const DbCache = DbCacheStr
        ? JSON.parse(DbCacheStr)
        : { users: {}, secrets: {} };
      this.oldApi = this.api;
      this.api = new APIStandalone(DbCache, this.cryptoAdapter.getSHA256);
      this.editableDB = false;
      this.dispatchEvent('connectionChange', { connection: 'offline' });
      this.testOnline();
    }
  }

  testOnline() {
    setTimeout(() => {
      this.oldApi
        .isOnline()
        .then(() => {
          this.api = this.oldApi;
          this.editableDB = true;
          this.dispatchEvent('connectionChange', { connection: 'online' });
          if (
            typeof this.currentUser.username !== 'undefined' &&
            typeof window.process !== 'undefined'
          ) {
            this.getDb().then(() => this.doCacheActions());
          }
          return Promise.resolve();
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

  setConflict(remote, local) {
    const conflictSecretsKey = `${SecretinPrefix}conflictSecrets${this.currentUser.username}`;
    const conflictSecretsStr = localStorage.getItem(conflictSecretsKey);
    const conflictSecrets = conflictSecretsStr
      ? JSON.parse(conflictSecretsStr)
      : {};
    conflictSecrets[remote] = local;
    return localStorage.setItem(
      conflictSecretsKey,
      JSON.stringify(conflictSecrets)
    );
  }

  getConflict(remote) {
    const conflictSecretsKey = `${SecretinPrefix}conflictSecrets${this.currentUser.username}`;
    const conflictSecretsStr = localStorage.getItem(conflictSecretsKey);
    const conflictSecrets = conflictSecretsStr
      ? JSON.parse(conflictSecretsStr)
      : {};
    if (typeof conflictSecrets[remote] !== 'undefined') {
      return conflictSecrets[remote];
    }
    return remote;
  }

  popCacheAction() {
    const cacheActionsKey = `${SecretinPrefix}cacheActions_${this.currentUser.username}`;
    const cacheActionsStr = localStorage.getItem(cacheActionsKey);
    const updatedCacheActions = JSON.parse(cacheActionsStr);
    updatedCacheActions.shift();
    return localStorage.setItem(
      cacheActionsKey,
      JSON.stringify(updatedCacheActions)
    );
  }

  pushCacheAction(action, args) {
    const cacheActionsKey = `${SecretinPrefix}cacheActions_${this.currentUser.username}`;
    const cacheActionsStr = localStorage.getItem(cacheActionsKey);
    const cacheActions = cacheActionsStr ? JSON.parse(cacheActionsStr) : [];
    cacheActions.push({
      action,
      args,
    });

    localStorage.setItem(cacheActionsKey, JSON.stringify(cacheActions));
  }

  doCacheActions() {
    const cacheActionsKey = `${SecretinPrefix}cacheActions_${this.currentUser.username}`;
    const cacheActionsStr = localStorage.getItem(cacheActionsKey);
    const cacheActions = cacheActionsStr ? JSON.parse(cacheActionsStr) : [];
    return cacheActions.reduce((promise, cacheAction) => {
      if (cacheAction.action === 'addSecret') {
        return promise.then(() =>
          this.api
            .addSecret(this.currentUser, cacheAction.args[0])
            .then(() => {
              this.currentUser.keys[cacheAction.args[0].hashedTitle] = {
                key: cacheAction.args[0].wrappedKey,
                rights: 2,
              };
              return this.cryptoAdapter.decryptRSAOAEP(
                cacheAction.args[1],
                this.currentUser.privateKey
              );
            })
            .then((metadatas) => {
              this.currentUser.metadatas[cacheAction.args[0].hashedTitle] =
                metadatas;
              return this.popCacheAction();
            })
        );
      }
      if (cacheAction.action === 'editSecret') {
        return promise.then(() => {
          const secretId = this.getConflict(cacheAction.args[0]);
          const encryptedContent = cacheAction.args[1];
          return this.cryptoAdapter
            .decryptRSAOAEP(encryptedContent, this.currentUser.privateKey)
            .then((content) => {
              if (typeof this.currentUser.keys[secretId] === 'undefined') {
                return this.addSecret(
                  `${content.title} (Conflict)`,
                  content.secret
                ).then((conflictSecretId) =>
                  this.setConflict(cacheAction.args[0], conflictSecretId)
                );
              }
              return this.editSecret(secretId, content.secret);
            })
            .then(() => this.popCacheAction());
        });
      }
      if (cacheAction.action === 'renameSecret') {
        return promise.then(() => {
          const secretId = this.getConflict(cacheAction.args[0]);
          const encryptedContent = cacheAction.args[1];
          return this.cryptoAdapter
            .decryptRSAOAEP(encryptedContent, this.currentUser.privateKey)
            .then((content) => {
              if (typeof this.currentUser.keys[secretId] === 'undefined') {
                return this.addSecret(
                  `${content.title} (Conflict)`,
                  content.secret
                ).then((conflictSecretId) =>
                  this.setConflict(cacheAction.args[0], conflictSecretId)
                );
              }
              return this.renameSecret(secretId, content.title);
            })
            .then(() => this.popCacheAction());
        });
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
    return this.api
      .userExists(username)
      .then(
        (exists) =>
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
          return this.getDb();
        }
        return Promise.resolve();
      })
      .then(() => this.currentUser)
      .catch((err) => {
        if (err === 'Offline') {
          this.offlineDB();
        }
        const wrapper = new WrappingError(err);
        throw wrapper.error;
      });
  }

  loginUser(
    username,
    password,
    otp,
    progress = defaultProgress,
    forceSync = true
  ) {
    let key;
    let hash;
    let remoteUser;
    let parameters;
    progress(new GetDerivationStatus());
    return this.api
      .getDerivationParameters(username)
      .then((rParameters) => {
        parameters = rParameters;
        if (parameters.totp && (typeof otp === 'undefined' || otp === '')) {
          throw new NeedTOTPTokenError();
        }
        progress(new PasswordDerivationStatus());
        return this.cryptoAdapter.derivePassword(password, parameters);
      })
      .then((dKey) => {
        hash = dKey.hash;
        key = dKey.key;
        progress(new GetUserStatus());
        return this.api.getUser(username, hash, otp);
      })
      .then((user) => {
        this.currentUser = new User(username, this.cryptoAdapter);
        this.currentUser.totp = parameters.totp;
        this.currentUser.hash = hash;
        remoteUser = user;
        progress(new DecryptPrivateKeyStatus());
        return this.currentUser.importPrivateKey(key, remoteUser.privateKey);
      })
      .then(() => {
        progress(new ImportPublicKeyStatus());
        return this.currentUser.importPublicKey(remoteUser.publicKey);
      })
      .then(() => {
        const shortpass = localStorage.getItem(`${SecretinPrefix}shortpass`);
        const signature = localStorage.getItem(
          `${SecretinPrefix}shortpassSignature`
        );
        if (shortpass && signature) {
          return this.currentUser.importPrivateData(shortpass, signature);
        }
        return Promise.resolve(null);
      })
      .then((shortpass) => {
        if (shortpass && this.editableDB) {
          const deviceName = localStorage.getItem(
            `${SecretinPrefix}deviceName`
          );
          return this.activateShortLogin(shortpass, deviceName);
        }
        return Promise.resolve();
      })
      .then(() => this.refreshUser(forceSync, progress))
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
          return this.loginUser(username, password, otp, progress);
        }
        const wrapper = new WrappingError(err);
        throw wrapper.error;
      });
  }

  updateMetadataCache(newMetadata, progress = defaultProgress) {
    return this.currentUser
      .decryptAllMetadatas(newMetadata, progress)
      .then((metadata) => {
        this.currentUser.metadatas = metadata;
        progress(new EndDecryptMetadataStatus());
        return this.currentUser.exportBigPrivateData(metadata);
      })
      .then((objectMetadataCache) =>
        this.api.editUser(this.currentUser, objectMetadataCache)
      );
  }

  refreshUser(rForceUpdate = false, progress = defaultProgress) {
    let forceUpdate = rForceUpdate;
    let remoteUser;
    return this.api
      .getUserWithSignature(this.currentUser)
      .then((user) => {
        remoteUser = user;
        this.currentUser.keys = remoteUser.keys;
        if (typeof window.process !== 'undefined') {
          // Electron
          return this.getDb();
        }
        return Promise.resolve();
      })
      .then(() => {
        progress(new DecryptUserOptionsStatus());
        return this.currentUser.importOptions(remoteUser.options);
      })
      .then(() => {
        if (typeof remoteUser.metadataCache !== 'undefined') {
          progress(new DecryptMetadataCacheStatus());
          return this.currentUser.importBigPrivateData(
            remoteUser.metadataCache
          );
        }
        forceUpdate = true;
        return Promise.resolve({});
      })
      .then((metadataCache) => {
        this.currentUser.metadatas = metadataCache;
        if (forceUpdate) {
          return this.updateMetadataCache(remoteUser.metadatas, progress);
        }
        this.updateMetadataCache(remoteUser.metadatas, progress);
        return Promise.resolve();
      })
      .catch((err) => {
        if (err === 'Offline') {
          this.offlineDB();
          return this.refreshUser(rForceUpdate, progress);
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
    let secretObject;
    return this.currentUser
      .createSecret(metadatas, content)
      .then((rSecretObject) => {
        secretObject = rSecretObject;
        hashedTitle = secretObject.hashedTitle;
        this.currentUser.keys[secretObject.hashedTitle] = {
          key: secretObject.wrappedKey,
          rights: metadatas.users[this.currentUser.username].rights,
        };
        if (!this.editableDB) {
          return this.cryptoAdapter
            .encryptRSAOAEP(metadatas, this.currentUser.publicKey)
            .then((encryptedMetadatas) => {
              this.pushCacheAction('addSecret', [
                secretObject,
                encryptedMetadatas,
              ]);
            });
        }
        return Promise.resolve();
      })
      .then(() => this.api.addSecret(this.currentUser, secretObject))
      .then(() => {
        this.currentUser.metadatas[hashedTitle] = metadatas;
        if (typeof inFolderId !== 'undefined') {
          return this.addSecretToFolder(hashedTitle, inFolderId);
        }
        return Promise.resolve();
      })
      .then(() => {
        if (typeof window.process !== 'undefined') {
          // Electron
          return this.getDb();
        }
        return Promise.resolve();
      })
      .then(() => hashedTitle)
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
    return this.currentUser
      .exportPrivateKey(password)
      .then((objectPrivateKey) =>
        this.api.editUser(this.currentUser, objectPrivateKey)
      )
      .then(() => {
        if (typeof window.process !== 'undefined') {
          // Electron
          return this.getDb();
        }
        return Promise.resolve();
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
    let secretObject;
    return this.api
      .getHistory(this.currentUser, hashedTitle)
      .then((history) =>
        this.currentUser.editSecret(hashedTitle, content, history)
      )
      .then((rSecretObject) => {
        secretObject = rSecretObject;
        if (!this.editableDB) {
          if (
            Object.keys(this.currentUser.metadatas[hashedTitle].users).length >
            1
          ) {
            return Promise.reject(new OfflineError());
          }
          const args = [hashedTitle];
          const toEncrypt = {
            secret: content,
            title: this.currentUser.metadatas[hashedTitle].title,
          };
          return this.cryptoAdapter
            .encryptRSAOAEP(toEncrypt, this.currentUser.publicKey)
            .then((encryptedContent) => {
              args.push(encryptedContent);
              return this.pushCacheAction('editSecret', args);
            });
        }
        return Promise.resolve();
      })
      .then(() =>
        this.api.editSecret(this.currentUser, secretObject, hashedTitle)
      )
      .then(() => {
        if (typeof window.process !== 'undefined') {
          // Electron
          return this.getDb();
        }
        return Promise.resolve();
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
    return this.currentUser
      .exportOptions()
      .then((encryptedOptions) =>
        this.api.editUser(this.currentUser, encryptedOptions)
      )
      .then(() => {
        if (typeof window.process !== 'undefined') {
          // Electron
          return this.getDb();
        }
        return Promise.resolve();
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
          return this.api
            .getPublicKey(friend.username)
            .then((publicKey) => friend.importPublicKey(publicKey))
            .then(() =>
              this.getSharedSecretObjects(
                hashedSecretTitle,
                friend,
                folderMetadatas.users[friend.username].rights,
                [],
                true
              )
            );
        })()
      );
    });

    const metadatasUsers = {};
    const commonParentToClean = [];
    return this.api
      .getSecret(hashedFolder, this.currentUser)
      .then((encryptedSecret) =>
        this.currentUser.decryptSecret(hashedFolder, encryptedSecret)
      )
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
            if (
              typeof metadatasUsers[newSharedSecretObject.hashedTitle] ===
              'undefined'
            ) {
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
          return this.api.shareSecret(
            this.currentUser,
            fullSharedSecretObjects
          );
        }
        return Promise.resolve();
      })
      .then(() => {
        const resetMetaPromises = [];
        Object.keys(folderMetadatas.users).forEach((username) => {
          Object.keys(folderMetadatas.users[username].folders).forEach(
            (parentFolder) => {
              if (
                typeof secretMetadatas.users[username] !== 'undefined' &&
                typeof secretMetadatas.users[username].folders[parentFolder] !==
                  'undefined'
              ) {
                commonParentToClean.push(parentFolder);
              }
            }
          );
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
              metaUser.folders[infos.folder] = true;
            } else {
              metaUser.folders[hashedFolder] = true;
            }

            commonParentToClean.forEach((parentFolder) => {
              delete metaUser.folders[parentFolder];
            });

            if (infos.friendName === this.currentUser.username) {
              metaUser.rights = 2;
            }
            this.currentUser.metadatas[hashedTitle].users[infos.friendName] =
              metaUser;
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
              this.api
                .getSecret(parentFolder, this.currentUser)
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
      .then(() => {
        if (typeof window.process !== 'undefined') {
          // Electron
          return this.getDb();
        }
        return Promise.resolve();
      })
      .then(() => hashedSecretTitle)
      .catch((err) => {
        if (err === 'Offline') {
          this.offlineDB();
          return this.addSecretToFolder(hashedSecretTitle, hashedFolder);
        }
        const wrapper = new WrappingError(err);
        throw wrapper.error;
      });
  }

  getSharedSecretObjects(
    hashedTitle,
    friend,
    rights,
    fullSharedSecretObjects,
    addUsername = false,
    hashedFolder
  ) {
    let isFolder = Promise.resolve();
    const sharedSecretObjectPromises = [];
    const secretMetadatas = this.currentUser.metadatas[hashedTitle];
    if (typeof secretMetadatas === 'undefined') {
      throw new DontHaveSecretError();
    } else {
      if (secretMetadatas.type === 'folder') {
        isFolder = isFolder
          .then(() => this.api.getSecret(hashedTitle, this.currentUser))
          .then((encryptedSecret) =>
            this.currentUser.decryptSecret(hashedTitle, encryptedSecret)
          )
          .then((secrets) => {
            Object.keys(secrets).forEach((hash) => {
              sharedSecretObjectPromises.push(
                this.getSharedSecretObjects(
                  hash,
                  friend,
                  rights,
                  fullSharedSecretObjects,
                  addUsername,
                  hashedTitle
                )
              );
            });
            return Promise.all(sharedSecretObjectPromises);
          });
      }

      return isFolder
        .then(() =>
          this.currentUser.shareSecret(
            friend,
            this.currentUser.keys[hashedTitle].key,
            hashedTitle
          )
        )
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

  renameSecret(hashedTitle, newTitle) {
    this.currentUser.metadatas[hashedTitle].title = newTitle;
    if (!this.editableDB) {
      if (
        Object.keys(this.currentUser.metadatas[hashedTitle].users).length > 1
      ) {
        return Promise.reject(new OfflineError());
      }
      const args = [hashedTitle];

      return this.getSecret(hashedTitle)
        .then((secret) => {
          const toEncrypt = {
            secret,
            title: newTitle,
          };
          return this.cryptoAdapter.encryptRSAOAEP(
            toEncrypt,
            this.currentUser.publicKey
          );
        })
        .then((encryptedContent) => {
          args.push(encryptedContent);
          return this.pushCacheAction('renameSecret', args);
        });
    }
    return this.resetMetadatas(hashedTitle).catch((err) => {
      if (err instanceof OfflineError) {
        return this.renameSecret(hashedTitle, newTitle);
      }
      throw err;
    });
  }

  resetMetadatas(hashedTitle) {
    return this.getSecret(hashedTitle)
      .then((secret) => this.editSecret(hashedTitle, secret))
      .then(() => {
        if (typeof window.process !== 'undefined') {
          // Electron
          return this.getDb();
        }
        return Promise.resolve();
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
    return this.api
      .getPublicKey(friend.username)
      .then(
        (publicKey) => friend.importPublicKey(publicKey),
        () => Promise.reject('Friend not found')
      )
      .then(() => this.getSharedSecretObjects(hashedTitle, friend, rights, []))
      .then((rSharedSecretObjects) => {
        sharedSecretObjects = rSharedSecretObjects;
        return this.api.shareSecret(this.currentUser, sharedSecretObjects);
      })
      .then(() => {
        const resetMetaPromises = [];
        sharedSecretObjects.forEach((sharedSecretObject) => {
          const secretMetadatas =
            this.currentUser.metadatas[sharedSecretObject.hashedTitle];
          secretMetadatas.users[friend.username] = {
            username: friend.username,
            rights,
            folders: {},
          };
          if (typeof sharedSecretObject.inFolder !== 'undefined') {
            secretMetadatas.users[friend.username].folders[
              sharedSecretObject.inFolder
            ] = true;
          } else {
            secretMetadatas.users[friend.username].folders.ROOT = true;
          }
          resetMetaPromises.push(
            this.resetMetadatas(sharedSecretObject.hashedTitle)
          );
        });
        return Promise.all(resetMetaPromises);
      })
      .then(() => {
        if (typeof window.process !== 'undefined') {
          // Electron
          return this.getDb();
        }
        return Promise.resolve();
      })
      .then(() => this.currentUser.metadatas[hashedTitle])
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
    if (typeof secretMetadatas === 'undefined') {
      return Promise.reject(new DontHaveSecretError());
    }
    if (secretMetadatas.type === 'folder') {
      isFolder = isFolder.then(() =>
        this.unshareFolderSecrets(hashedTitle, friendName)
      );
    }

    return isFolder
      .then(() =>
        this.api.unshareSecret(this.currentUser, [friendName], hashedTitle)
      )
      .then((result) => {
        if (result !== 'Secret unshared') {
          const wrapper = new WrappingError(result);
          throw wrapper.error;
        }
        delete secretMetadatas.users[friendName];
        return this.resetMetadatas(hashedTitle);
      })
      .then(() => this.renewKey(hashedTitle))
      .then(() => {
        if (typeof window.process !== 'undefined') {
          // Electron
          return this.getDb();
        }
        return Promise.resolve();
      })
      .then(() => this.currentUser.metadatas[hashedTitle])
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
    return this.api
      .getSecret(hashedFolder, this.currentUser)
      .then((encryptedSecret) =>
        this.currentUser.decryptSecret(hashedFolder, encryptedSecret)
      )
      .then((secrets) =>
        Object.keys(secrets).reduce(
          (promise, hashedTitle) =>
            promise.then(() => this.unshareSecret(hashedTitle, friendName)),
          Promise.resolve()
        )
      )
      .then(() => {
        if (typeof window.process !== 'undefined') {
          // Electron
          return this.getDb();
        }
        return Promise.resolve();
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
    return this.api
      .getPublicKey(hashedUsername, true)
      .then((publicKey) => {
        friend = new User(hashedUsername, this.cryptoAdapter);
        return friend.importPublicKey(publicKey);
      })
      .then(() => this.currentUser.wrapKey(key, friend.publicKey))
      .then((friendWrappedKey) => ({
        user: hashedUsername,
        key: friendWrappedKey,
      }))
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
    let history;
    return this.api
      .getSecret(hashedTitle, this.currentUser)
      .then((eSecret) => {
        encryptedSecret = eSecret;
        return this.api.getHistory(this.currentUser, hashedTitle);
      })
      .then((rHistory) => {
        history = rHistory;
        return this.currentUser.decryptSecret(hashedTitle, encryptedSecret);
      })
      .then((rawSecret) =>
        this.currentUser.encryptSecret(
          this.currentUser.metadatas[hashedTitle],
          rawSecret,
          history
        )
      )
      .then((secretObject) => {
        secret.secret = secretObject.secret;
        secret.iv = secretObject.iv;
        secret.metadatas = secretObject.metadatas;
        secret.iv_meta = secretObject.iv_meta;
        secret.history = secretObject.history;
        secret.iv_history = secretObject.iv_history;
        hashedCurrentUsername = secretObject.hashedUsername;
        const wrappedKeysPromises = [];
        encryptedSecret.users.forEach((hashedUsername) => {
          if (hashedCurrentUsername === hashedUsername) {
            wrappedKeysPromises.push(
              this.currentUser
                .wrapKey(secretObject.key, this.currentUser.publicKey)
                .then((wrappedKey) => ({
                  user: hashedCurrentUsername,
                  key: wrappedKey,
                }))
            );
          } else {
            wrappedKeysPromises.push(
              this.wrapKeyForFriend(hashedUsername, secretObject.key)
            );
          }
        });

        return Promise.all(wrappedKeysPromises);
      })
      .then((rWrappedKeys) => {
        wrappedKeys = rWrappedKeys;
        return this.api.newKey(
          this.currentUser,
          hashedTitle,
          secret,
          wrappedKeys
        );
      })
      .then(() => {
        wrappedKeys.forEach((wrappedKey) => {
          if (wrappedKey.user === hashedCurrentUsername) {
            this.currentUser.keys[hashedTitle].key = wrappedKey.key;
          }
        });
      })
      .then(() => {
        if (typeof window.process !== 'undefined') {
          // Electron
          return this.getDb();
        }
        return Promise.resolve();
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
      if (
        typeof secretMetadatas.users[username].folders[hashedFolder] !==
        'undefined'
      ) {
        usersToDelete.push(username);
      }
    });

    return Promise.resolve()
      .then(() => {
        if (usersToDelete.length > 1) {
          if (!this.editableDB) {
            return Promise.reject(new OfflineError());
          }
          return this.api.unshareSecret(
            this.currentUser,
            usersToDelete,
            hashedTitle
          );
        }
        return Promise.resolve();
      })
      .then(() => {
        usersToDelete.forEach((username) => {
          delete secretMetadatas.users[username].folders[hashedFolder];
          if (
            Object.keys(secretMetadatas.users[username].folders).length === 0
          ) {
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
        this.currentUser.decryptSecret(hashedFolder, encryptedSecret)
      )
      .then((secret) => {
        const folder = secret;
        delete folder[hashedTitle];
        return this.editSecret(hashedFolder, folder);
      })
      .then(() => {
        if (typeof window.process !== 'undefined') {
          // Electron
          return this.getDb();
        }
        return Promise.resolve();
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
    return this.api
      .getSecret(hashedTitle, this.currentUser)
      .then((encryptedSecret) =>
        this.currentUser.decryptSecret(hashedTitle, encryptedSecret)
      )
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

  getHistory(hashedTitle, index) {
    return this.api
      .getHistory(this.currentUser, hashedTitle)
      .then((encryptedHistory) =>
        this.currentUser.decryptSecret(hashedTitle, encryptedHistory)
      )
      .then((history) => {
        if (typeof index === 'undefined') {
          return history;
        }
        if (index < 0) {
          const diff = -index % history.length;
          return history[-diff];
        }
        return history[index % history.length];
      })
      .catch((err) => {
        if (err === 'Offline') {
          this.offlineDB();
          return this.getHistory(hashedTitle, index);
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
    if (typeof secretMetadatas === 'undefined') {
      return Promise.reject(new DontHaveSecretError());
    }
    if (secretMetadatas.type === 'folder' && list.indexOf(hashedTitle) === -1) {
      isFolder = isFolder.then(() =>
        this.deleteFolderSecrets(hashedTitle, list)
      );
    }

    return isFolder
      .then(() => this.api.deleteSecret(this.currentUser, hashedTitle))
      .then(() => {
        delete this.currentUser.metadatas[hashedTitle];
        delete this.currentUser.keys[hashedTitle];
        const editFolderPromises = [];
        const currentUsername = this.currentUser.username;
        Object.keys(secretMetadatas.users[currentUsername].folders).forEach(
          (hashedFolder) => {
            if (hashedFolder !== 'ROOT') {
              editFolderPromises.push(
                this.api
                  .getSecret(hashedFolder, this.currentUser)
                  .then((encryptedSecret) =>
                    this.currentUser.decryptSecret(
                      hashedFolder,
                      encryptedSecret
                    )
                  )
                  .then((secret) => {
                    const folder = secret;
                    delete folder[hashedTitle];
                    return this.editSecret(hashedFolder, folder);
                  })
              );
            }
          }
        );
        return Promise.all(editFolderPromises);
      })
      .then(() => {
        if (typeof window.process !== 'undefined') {
          // Electron
          return this.getDb();
        }
        return Promise.resolve();
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
    return this.api
      .getSecret(hashedFolder, this.currentUser)
      .then((encryptedSecret) =>
        this.currentUser.decryptSecret(hashedFolder, encryptedSecret)
      )
      .then((secrets) =>
        Object.keys(secrets).reduce(
          (promise, hashedTitle) =>
            promise.then(() => this.deleteSecret(hashedTitle, list)),
          Promise.resolve()
        )
      )
      .then(() => {
        if (typeof window.process !== 'undefined') {
          // Electron
          return this.getDb();
        }
        return Promise.resolve();
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
    return this.api
      .deactivateTotp(this.currentUser)
      .then(() => {
        if (typeof window.process !== 'undefined') {
          // Electron
          return this.getDb();
        }
        return Promise.resolve();
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
    const protectedSeed = xorSeed(
      hexStringToUint8Array(this.currentUser.hash),
      seed.raw
    );
    return this.api
      .activateTotp(protectedSeed, this.currentUser)
      .then(() => {
        if (typeof window.process !== 'undefined') {
          // Electron
          return this.getDb();
        }
        return Promise.resolve();
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
      return this.currentUser
        .activateShortLogin(shortpass, deviceName)
        .then((toSend) => this.api.activateShortLogin(toSend, this.currentUser))
        .then(() => {
          if (typeof window.process !== 'undefined') {
            // Electron
            return this.getDb();
          }
          return Promise.resolve();
        })
        .then(() => this.currentUser.exportPrivateData(shortpass))
        .then((result) => {
          localStorage.setItem(`${SecretinPrefix}shortpass`, result.data);
          localStorage.setItem(
            `${SecretinPrefix}shortpassSignature`,
            result.signature
          );
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
      localStorage.removeItem(`${SecretinPrefix}username`);
      localStorage.removeItem(`${SecretinPrefix}deviceName`);
      localStorage.removeItem(`${SecretinPrefix}privateKey`);
      localStorage.removeItem(`${SecretinPrefix}privateKeyIv`);
      localStorage.removeItem(`${SecretinPrefix}iv`);
      localStorage.removeItem(`${SecretinPrefix}shortpass`);
      localStorage.removeItem(`${SecretinPrefix}shortpassSignature`);
      return Promise.resolve();
    }
    return Promise.reject(new LocalStorageUnavailableError());
  }

  shortLogin(shortpass, progress = defaultProgress, forceSync = true) {
    const username = localStorage.getItem(`${SecretinPrefix}username`);
    const deviceName = localStorage.getItem(`${SecretinPrefix}deviceName`);
    let shortpassKey;
    let parameters;
    this.currentUser = new User(username, this.cryptoAdapter);
    progress(new GetDerivationStatus());
    return this.api
      .getProtectKeyParameters(username, deviceName)
      .then((rParameters) => {
        parameters = rParameters;
        this.currentUser.totp = parameters.totp;
        progress(new PasswordDerivationStatus());
        return this.cryptoAdapter.derivePassword(shortpass, parameters);
      })
      .then((dKey) => {
        shortpassKey = dKey.key;
        progress(new GetProtectKeyStatus());
        return this.api.getProtectKey(username, deviceName, dKey.hash);
      })
      .then((protectKey) => {
        progress(new DecryptPrivateKeyStatus());
        return this.currentUser.shortLogin(shortpassKey, protectKey);
      })
      .then(() => {
        progress(new ImportPublicKeyStatus());
        return this.currentUser.importPublicKey(parameters.publicKey);
      })
      .then(() => this.refreshUser(forceSync, progress))
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
        if (
          err !== 'Not available in standalone mode' &&
          !(err instanceof NotAvailableError)
        ) {
          localStorage.removeItem(`${SecretinPrefix}username`);
          localStorage.removeItem(`${SecretinPrefix}privateKey`);
          localStorage.removeItem(`${SecretinPrefix}privateKeyIv`);
          localStorage.removeItem(`${SecretinPrefix}iv`);
        }
        const wrapper = new WrappingError(err);
        throw wrapper.error;
      });
  }

  canITryShortLogin() {
    return (
      this.editableDB &&
      localStorageAvailable() &&
      localStorage.getItem(`${SecretinPrefix}username`) !== null
    );
  }

  getSavedUsername() {
    if (this.canITryShortLogin()) {
      return localStorage.getItem(`${SecretinPrefix}username`);
    }
    return null;
  }

  getRescueCodes() {
    return this.api.getRescueCodes(this.currentUser).catch((err) => {
      if (err === 'Offline') {
        this.offlineDB();
        return this.getRescueCodes();
      }
      const wrapper = new WrappingError(err);
      throw wrapper.error;
    });
  }

  getDb() {
    const cacheKey = `${SecretinPrefix}cache_${this.currentUser.username}`;
    const DbCacheStr = localStorage.getItem(cacheKey);
    const DbCache = DbCacheStr
      ? JSON.parse(DbCacheStr)
      : { users: {}, secrets: {} };
    const revs = {};
    Object.keys(DbCache.secrets).forEach((key) => {
      revs[key] = DbCache.secrets[key].rev;
    });
    return this.api
      .getDb(this.currentUser, revs)
      .then((newDb) => {
        Object.keys(newDb.secrets).forEach((key) => {
          if (
            typeof DbCache.secrets[key] !== 'undefined' &&
            DbCache.secrets[key].editOffline
          ) {
            this.setConflict(key, 'conflict');
          }
        });
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

  exportDb(password) {
    let oldSecretin;
    return this.api
      .getDb(this.currentUser, {})
      .then((db) => {
        if (typeof password === 'undefined') {
          return Promise.resolve(db);
        }
        oldSecretin = new Secretin(
          this.cryptoAdapter,
          APIStandalone,
          JSON.parse(JSON.stringify(db))
        );
        oldSecretin.currentUser = this.currentUser;
        return oldSecretin
          .changePassword(password)
          .then(() => oldSecretin.api.getDb(oldSecretin.currentUser, {}));
      })
      .then((rDB) => {
        const db = rDB;
        db.username = this.currentUser.username;
        return JSON.stringify(db);
      });
  }

  importDb(password, jsonDB, progress = defaultProgress) {
    if (!this.editableDB) {
      return Promise.reject(new OfflineError());
    }
    const oldDB = JSON.parse(jsonDB);
    const { username } = oldDB;
    const oldSecretin = new Secretin(this.cryptoAdapter, APIStandalone, oldDB);
    let key;
    let hash;
    let remoteUser;
    let parameters;
    let encryptedMetadata;
    const newHashedTitles = {};
    return oldSecretin.api
      .getDerivationParameters(username)
      .then((rParameters) => {
        parameters = rParameters;
        return this.cryptoAdapter.derivePassword(password, parameters);
      })
      .then((dKey) => {
        hash = dKey.hash;
        key = dKey.key;
        return oldSecretin.api.getUser(username, hash);
      })
      .then((user) => {
        oldSecretin.currentUser = new User(username, this.cryptoAdapter);
        oldSecretin.currentUser.totp = parameters.totp;
        oldSecretin.currentUser.hash = hash;
        remoteUser = user;
        return oldSecretin.currentUser.importPrivateKey(
          key,
          remoteUser.privateKey
        );
      })
      .then(() => oldSecretin.currentUser.importPublicKey(remoteUser.publicKey))
      .then(() => oldSecretin.api.getUserWithSignature(oldSecretin.currentUser))
      .then((user) => {
        encryptedMetadata = user.metadatas;
        oldSecretin.currentUser.keys = user.keys;
        const hashedTitles = Object.keys(oldSecretin.currentUser.keys);
        const newHashedTitlePromises = [];
        hashedTitles.forEach((hashedTitle) => {
          const now = Date.now();
          const saltedTitle = `${now}|${hashedTitle}`;
          newHashedTitlePromises.push(
            this.cryptoAdapter
              .getSHA256(saltedTitle)
              .then((newHashedTitle) => ({
                old: hashedTitle,
                new: newHashedTitle,
              }))
          );
        });

        return Promise.all(newHashedTitlePromises);
      })
      .then((rNewHashedTitles) => {
        rNewHashedTitles.forEach((newHashedTitle) => {
          newHashedTitles[newHashedTitle.old] = newHashedTitle.new;
        });

        const hashedTitles = Object.keys(oldSecretin.currentUser.keys);
        const progressStatus = new ImportSecretStatus(0, hashedTitles.length);
        progress(progressStatus);

        return hashedTitles.reduce((promise, hashedTitle) => {
          let encryptedSecret;
          let newMetadata;
          return promise.then(() =>
            oldSecretin.api
              .getSecret(hashedTitle, oldSecretin.currentUser)
              .then((rEncryptedSecret) => {
                encryptedSecret = rEncryptedSecret;
                return oldSecretin.api.getHistory(
                  oldSecretin.currentUser,
                  hashedTitle
                );
              })
              .then((encryptedHistory) =>
                oldSecretin.currentUser.exportSecret(
                  hashedTitle,
                  encryptedSecret,
                  encryptedMetadata[hashedTitle],
                  encryptedHistory
                )
              )
              .then(({ secret, metadata, history }) => {
                newMetadata = metadata;
                const newSecret = secret;
                const oldFolders = Object.keys(
                  newMetadata.users[oldSecretin.currentUser.username].folders
                );
                const newFolders = {};
                oldFolders.forEach((oldFolder) => {
                  if (oldFolder !== 'ROOT') {
                    newFolders[newHashedTitles[oldFolder]] = true;
                  } else {
                    newFolders.ROOT = true;
                  }
                });

                newMetadata.id = newHashedTitles[metadata.id];
                newMetadata.users = {
                  [this.currentUser.username]: {
                    username: this.currentUser.username,
                    rights: 2,
                    folders: newFolders,
                  },
                };

                const now = new Date();
                newMetadata.lastModifiedAt = now.toISOString();
                newMetadata.lastModifiedBy = this.currentUser.username;

                if (metadata.type === 'folder') {
                  const oldSecrets = Object.keys(secret);
                  oldSecrets.forEach((oldSecret) => {
                    const newSecretTitle = newHashedTitles[oldSecret];
                    newSecret[newSecretTitle] = 1;
                    delete newSecret[oldSecret];
                  });
                }

                return this.currentUser.importSecret(
                  newHashedTitles[hashedTitle],
                  newSecret,
                  newMetadata,
                  history
                );
              })
              .then((secretObject) => {
                this.currentUser.keys[secretObject.hashedTitle] = {
                  key: secretObject.wrappedKey,
                  rights: newMetadata.users[this.currentUser.username].rights,
                };
                this.currentUser.metadatas[secretObject.hashedTitle] =
                  newMetadata;
                return this.api.addSecret(this.currentUser, secretObject);
              })
              .then(() => {
                progressStatus.step();
                progress(progressStatus);
              })
          );
        }, Promise.resolve());
      });
  }
}

export default Secretin;
