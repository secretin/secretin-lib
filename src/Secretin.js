import {
  derivePassword,
} from './lib/crypto';

import {
  bytesToHexString,
} from './lib/util';

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
    const result = {};
    const pass = {};
    this.currentUser = new User(username);
    return this.api.userExists(username)
      .then((exists) =>
        new Promise((resolve, reject) => {
          if (!exists) {
            resolve(this.currentUser.generateMasterKey());
          } else {
            reject('Username already exists');
          }
        })
      )
      .then(() => derivePassword(password))
      .then((dKey) => {
        pass.salt = bytesToHexString(dKey.salt);
        pass.hash = bytesToHexString(dKey.hash);
        pass.iterations = dKey.iterations;
        return this.currentUser.exportPrivateKey(dKey.key);
      })
      .then((privateKey) => {
        result.privateKey = privateKey;
        return this.currentUser.exportPublicKey();
      })
      .then((publicKey) => {
        result.publicKey = publicKey;
        return this.api.addUser(
          this.currentUser.username,
          result.privateKey,
          result.publicKey,
          pass
        );
      })
      .then(() => this.currentUser);
  }

  loginUser(username, password) {
    let key;
    let remoteUser;
    return this.api.getDerivationParameters(username)
      .then((parameters) => derivePassword(password, parameters))
      .then((dKey) => {
        key = dKey.key;
        return this.api.getUser(username, bytesToHexString(dKey.hash));
      })
      .then((user) => {
        this.currentUser = new User(username);
        remoteUser = user;
        this.currentUser.keys = remoteUser.keys;
        return this.currentUser.importPublicKey(remoteUser.publicKey);
      })
      .then(() => this.currentUser.importPrivateKey(key, remoteUser.privateKey))
      .then(() => this.currentUser.decryptAllMetadatas(remoteUser.metadatas))
      .then(() => this.currentUser);
  }

  refreshUser() {
    return this.api.getUserWithToken(this.currentUser)
      .then((user) => {
        this.currentUser.keys = user.keys;
        return this.currentUser.decryptAllMetadatas(user.metadatas);
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
      folders: {},
      title: clearTitle,
      type: 'secret',
    };
    if (isFolder) {
      metadatas.type = 'folder';
    }


    return new Promise((resolve, reject) => {
      if (typeof this.currentUser.currentFolder !== 'undefined') {
        metadatas.users[this.currentUser.username] = {
          username: this.currentUser.username,
          rights: this.currentUser.keys[this.currentUser.currentFolder].rights,
        };
      } else {
        metadatas.users[this.currentUser.username] = {
          username: this.currentUser.username,
          rights: 2,
        };
      }

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
              resolve();
            }
          });
      } else {
        reject('You are disconnected');
      }
    });
  }

  changePassword(password) {
    const pass = {};
    return derivePassword(password)
      .then((dKey) => {
        pass.salt = bytesToHexString(dKey.salt);
        pass.hash = bytesToHexString(dKey.hash);
        pass.iterations = dKey.iterations;
        return this.currentUser.exportPrivateKey(dKey.key);
      })
      .then((privateKey) => this.api.changePassword(this.currentUser, privateKey, pass));
  }

  editSecret(hashedTitle, content) {
    return this.currentUser.editSecret(hashedTitle, content)
      .then((secretObject) => this.api.editSecret(this.currentUser, secretObject, hashedTitle));
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
              friend, folderMetadatas.users[friend.username].rights,
              []
            ));
        })()
      );
    });

    const metadatasUsers = {};
    const currentFolder = this.currentUser.currentFolder;
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
        if (typeof currentFolder !== 'undefined') {
          delete secretMetadatas.folders[currentFolder];
        }
        secretMetadatas.folders[hashedFolder] = {
          name: folderMetadatas.title,
        };
        Object.keys(metadatasUsers).forEach((hashedTitle) => {
          metadatasUsers[hashedTitle].forEach((infos) => {
            const metaUser = {
              username: infos.friendName,
              rights: folderMetadatas.users[infos.friendName].rights,
            };
            if (typeof (infos.folder) === 'undefined') {
              metaUser.folder = folderMetadatas.title;
            } else {
              metaUser.folder = infos.folder;
            }
            if (infos.friendName === this.currentUser.username) {
              if (typeof currentFolder === 'undefined') {
                metaUser.rights = 2;
              } else {
                metaUser.rights = this.currentUser.keys[currentFolder].rights;
              }
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
        const folder = JSON.parse(secret);
        folder[hashedSecretTitle] = 1;
        return this.editSecret(hashedFolder, folder);
      });
  }

  getSharedSecretObjects(hashedTitle, friend, rights, fullSharedSecretObjects, folderName) {
    let isFolder = Promise.resolve();
    const sharedSecretObjectPromises = [];
    const secretMetadatas = this.currentUser.metadatas[hashedTitle];
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
              secretMetadatas.title
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
        newSecretObject.inFolder = folderName;
        newSecretObject.username = friend.username;
        fullSharedSecretObjects.push(newSecretObject);
        return fullSharedSecretObjects;
      });
  }

  resetMetadatas(hashedTitle) {
    const secretMetadatas = this.currentUser.metadatas[hashedTitle];
    const now = new Date();
    secretMetadatas.lastModifiedAt = now;
    secretMetadatas.lastModifiedBy = this.currentUser.username;
    return this.getSecret(hashedTitle)
      .then((secret) => this.editSecret(hashedTitle, secret));
  }

  shareSecret(hashedTitle, friendName, type, rights) {
    if (type === 'folder') {
      return new Promise((resolve, reject) => {
        let hashedFolder = false;
        Object.keys(this.currentUser.metadatas).forEach((hash) => {
          const secretMetadatas = this.currentUser.metadatas[hash];
          if (secretMetadatas.type === 'folder'
              && secretMetadatas.title === friendName) {
            hashedFolder = hash;
          }
        });
        if (hashedFolder === false) {
          reject('Folder not found');
        } else if (hashedTitle === hashedFolder) {
          reject('You can\'t put this folder in itself.');
        } else {
          resolve(this.addSecretToFolder(hashedTitle, hashedFolder));
        }
      });
    }


    let sharedSecretObjects;
    const friend = new User(friendName);
    return this.api.getPublicKey(friend.username)
      .then((publicKey) => friend.importPublicKey(publicKey))
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
          };
          if (typeof sharedSecretObject.inFolder !== 'undefined') {
            secretMetadatas.users[friend.username].folder = sharedSecretObject.inFolder;
          }
          resetMetaPromises.push(this.resetMetadatas(sharedSecretObject.hashedTitle));
        });
        return Promise.all(resetMetaPromises);
      });
  }

  unshareSecret(hashedTitle, friendName) {
    let isFolder = Promise.resolve();
    const secretMetadatas = this.currentUser.metadatas[hashedTitle];
    if (secretMetadatas.type === 'folder') {
      isFolder = isFolder
        .then(() => this.unshareFolderSecrets(hashedTitle, friendName));
    }

    return isFolder
      .then(() => this.api.unshareSecret(this.currentUser, [friendName], hashedTitle))
      .then(() => {
        delete secretMetadatas.users[friendName];
        return this.resetMetadatas(hashedTitle);
      })
      .then(() => this.renewKey(hashedTitle), (err) => {
        if (err.status === 'Desync') {
          delete this.currentUser.metadatas[err.datas.title].users[err.datas.friendName];
          return this.resetMetadatas(hashedTitle);
        }
        throw (err);
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
      );
  }

  wrapKeyForFriend(hashedUsername, key) {
    let friend;
    return this.api.getPublicKey(hashedUsername, true)
      .then((publicKey) => {
        friend = new User(hashedUsername);
        return friend.importPublicKey(publicKey);
      })
      .then(() => this.currentUser.wrapKey(key, friend.publicKey))
      .then((friendWrappedKey) => ({ user: hashedUsername, key: friendWrappedKey }));
  }

  renewKey(hashedTitle) {
    let encryptedSecret;
    const secret = {};
    let hashedCurrentUsername;
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
      .then((wrappedKeys) => {
        wrappedKeys.forEach((wrappedKey) => {
          if (wrappedKey.user === hashedCurrentUsername) {
            this.currentUser.keys[hashedTitle].key = wrappedKey.key;
          }
        });
        return this.api.newKey(this.currentUser, hashedTitle, secret, wrappedKeys);
      });
  }

  removeSecretFromFolder(hashedTitle, hashedFolder) {
    const secretMetadatas = this.currentUser.metadatas[hashedTitle];
    const folderMetadatas = this.currentUser.metadatas[hashedFolder];
    const usersToDelete = [];
    Object.keys(secretMetadatas.users).forEach((username) => {
      if (typeof secretMetadatas.users[username].folder !== 'undefined'
          && secretMetadatas.users[username].folder === folderMetadatas.title) {
        usersToDelete.push(username);
      }
    });
    return this.api.unshareSecret(this.currentUser, usersToDelete, hashedTitle)
      .then(() => {
        usersToDelete.forEach((username) => {
          if (username !== this.currentUser.username) {
            delete secretMetadatas.users[username];
          } else {
            delete secretMetadatas.users[username].folder;
          }
        });
        delete secretMetadatas.folders[hashedFolder];
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
      });
  }

  getSecret(hashedTitle) {
    return this.api.getSecret(hashedTitle, this.currentUser)
      .then((encryptedSecret) =>
        this.currentUser.decryptSecret(hashedTitle, encryptedSecret))
      .then((secret) => JSON.parse(secret));
  }

  deleteSecret(hashedTitle) {
    let isFolder = Promise.resolve();
    const secretMetadatas = this.currentUser.metadatas[hashedTitle];
    if (secretMetadatas.type === 'folder') {
      isFolder = isFolder
        .then(() => this.deleteFolderSecrets(hashedTitle));
    }

    return isFolder
    .then(() => this.api.deleteSecret(this.currentUser, hashedTitle))
    .then(() => {
      delete this.currentUser.metadatas[hashedTitle];
      delete this.currentUser.keys[hashedTitle];
      const editFolderPromises = [];
      Object.keys(secretMetadatas.folders).forEach((hashedFolder) => {
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
      });
      return Promise.all(editFolderPromises);
    });
  }

  deleteFolderSecrets(hashedFolder) {
    return this.api.getSecret(hashedFolder, this.currentUser)
      .then((encryptedSecret) =>
        this.currentUser.decryptSecret(hashedFolder, encryptedSecret))
      .then((secrets) =>
        Object.keys(JSON.parse(secrets)).reduce(
          (promise, hashedTitle) =>
            promise.then(() =>
              this.deleteSecret(hashedTitle))
          , Promise.resolve()
        )
      );
  }
}

export default Secretin;
