import {
  derivePassword,
} from './lib/crypto';

import {
  bytesToHexString,
} from './lib/util';

import APIStandalone from './API/Standalone';
import User from './User';

class Secretin {
  constructor(API = APIStandalone) {
    this.api = new API();
    this.currentUser = {};
  }

  changeDB(db) {
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
        this.currentUser.hash = pass.hash;
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
      });
  }

  getKeys(username, password) {
    let key;
    let hash;
    let remoteUser;
    return this.api.getDerivationParameters(username)
      .then((parameters) => derivePassword(password, parameters))
      .then((dKey) => {
        key = dKey.key;
        hash = bytesToHexString(dKey.hash);
        return this.api.getUser(username, hash);
      })
      .then((user) => {
        this.currentUser = new User(username);
        remoteUser = user;
        this.currentUser.keys = remoteUser.keys;
        this.currentUser.hash = hash;
        return this.currentUser.importPublicKey(remoteUser.publicKey);
      })
      .then(() => this.currentUser.importPrivateKey(key, remoteUser.privateKey));
  }

  refreshKeys() {
    return this.api.getKeysWithToken(this.currentUser)
      .then((keys) => {
        this.currentUser.keys = keys;
        return keys;
      });
  }

  addSecret(metadatas, content) {
    let hashedTitle;
    const newMetadatas = metadatas;
    newMetadatas.users = {};
    newMetadatas.folders = {};
    return new Promise((resolve, reject) => {
      if (typeof this.currentUser.currentFolder !== 'undefined') {
        newMetadatas.users[this.currentUser.username] = {
          rights: this.currentUser.keys[this.currentUser.currentFolder].rights,
        };
      } else {
        newMetadatas.users[this.currentUser.username] = { rights: 2 };
      }

      if (typeof this.currentUser.username === 'string') {
        this.currentUser.createSecret(newMetadatas, content)
          .then((secretObject) => {
            hashedTitle = secretObject.hashedTitle;
            return this.api.addSecret(this.currentUser, secretObject);
          })
          .then(() => this.refreshKeys())
          .then(() => this.getAllMetadatas())
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

  editSecret(hashedTitle, metadatas, content) {
    return this.currentUser.editSecret(metadatas, content, this.currentUser.keys[hashedTitle].key)
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
        this.currentUser.decryptSecret(encryptedSecret, this.currentUser.keys[hashedFolder].key))
      .then((secret) => {
        const folder = JSON.parse(secret);
        folder[hashedSecretTitle] = 1;
        return this.editSecret(hashedFolder, folderMetadatas, folder);
      });
  }

  getSharedSecretObjects(hashedTitle, friend, rights, fullSharedSecretObjects, folderName) {
    let isFolder = Promise.resolve();
    const sharedSecretObjectPromises = [];
    const secretMetadatas = this.currentUser.metadatas[hashedTitle];
    if (typeof secretMetadatas.type !== 'undefined'
        && secretMetadatas.type === 'folder') {
      isFolder = isFolder
        .then(() => this.api.getSecret(hashedTitle, this.currentUser))
        .then((encryptedSecret) =>
          this.currentUser.decryptSecret(encryptedSecret, this.currentUser.keys[hashedTitle].key))
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
    return this.api.getSecret(hashedTitle, this.currentUser)
      .then((encryptedSecret) =>
        this.currentUser.decryptSecret(encryptedSecret, this.currentUser.keys[hashedTitle].key))
      .then((secret) =>
        this.editSecret(hashedTitle, this.currentUser.metadatas[hashedTitle], JSON.parse(secret)));
  }

  shareSecret(hashedTitle, friendName, rights, type) {
    if (type === 'folder') {
      return new Promise((resolve, reject) => {
        let hashedFolder = false;
        Object.keys(this.currentUser.metadatas).forEach((hash) => {
          const secretMetadatas = this.currentUser.metadatas[hash];
          if (typeof secretMetadatas.type !== 'undefined'
              && secretMetadatas.type === 'folder'
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
          secretMetadatas.users[friend.username] = { rights };
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
    if (typeof secretMetadatas.type !== 'undefined'
      && secretMetadatas.type === 'folder') {
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
        this.currentUser.decryptSecret(encryptedSecret, this.currentUser.keys[hashedFolder].key))
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
    return this.api.getSecret(hashedTitle, this.currentUser)
      .then((eSecret) => {
        encryptedSecret = eSecret;
        return this.currentUser.decryptSecret(
          encryptedSecret,
          this.currentUser.keys[hashedTitle].key
        );
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
        const wrappedKeysPromises = [];
        encryptedSecret.users.forEach((hashedUsername) => {
          wrappedKeysPromises.push(this.wrapKeyForFriend(hashedUsername, secretObject.key));
        });

        return Promise.all(wrappedKeysPromises);
      })
      .then((wrappedKeys) =>
        this.api.newKey(this.currentUser, hashedTitle, secret, wrappedKeys));
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
      .then(() => this.api.getSecret(hashedFolder, this.currentUser))
      .then((encryptedSecret) =>
        this.currentUser.decryptSecret(encryptedSecret, this.currentUser.keys[hashedFolder].key))
      .then((secret) => {
        const folder = JSON.parse(secret);
        delete folder[hashedTitle];
        return this.editSecret(hashedFolder, folderMetadatas, folder);
      });
  }

  getSecret(hashedTitle) {
    return this.api.getSecret(hashedTitle, this.currentUser)
      .then((rEncryptedSecret) => {
        const encryptedSecret = {
          secret: rEncryptedSecret.secret,
          iv: rEncryptedSecret.iv,
        };
        return this.currentUser.decryptSecret(
          encryptedSecret,
          this.currentUser.keys[hashedTitle].key
        );
      });
  }

  deleteSecret(hashedTitle) {
    let isFolder = Promise.resolve();
    const secretMetadatas = this.currentUser.metadatas[hashedTitle];
    if (typeof secretMetadatas.type !== 'undefined'
        && secretMetadatas.type === 'folder') {
      isFolder = isFolder
        .then(() => this.deleteFolderSecrets(hashedTitle));
    }

    return isFolder.then(() => {
      delete secretMetadatas.users[this.currentUser.username];
      return this.resetMetadatas(hashedTitle);
    })
    .then(() => this.api.deleteSecret(this.currentUser, hashedTitle))
    .then(() => {
      const editFolderPromises = [];
      Object.keys(secretMetadatas.folders).forEach((hashedFolder) => {
        editFolderPromises.push(
          this.api.getSecret(hashedFolder, this.currentUser)
            .then((encryptedSecret) =>
              this.currentUser.decryptSecret(
                encryptedSecret,
                this.currentUser.keys[hashedFolder].key
              ))
            .then((secret) => {
              const folder = JSON.parse(secret);
              delete folder[hashedTitle];
              this.editSecret(
                hashedFolder,
                this.currentUser.metadatas[hashedFolder],
                folder
              );
            })
        );
      });
      return Promise.all(editFolderPromises);
    });
  }

  deleteFolderSecrets(hashedFolder) {
    return this.api.getSecret(hashedFolder, this.currentUser)
      .then((encryptedSecret) =>
        this.currentUser.decryptSecret(encryptedSecret, this.currentUser.keys[hashedFolder].key))
      .then((secrets) =>
        Object.keys(JSON.parse(secrets)).reduce(
          (promise, hashedTitle) =>
            promise.then(() =>
              this.deleteSecret(hashedTitle))
          , Promise.resolve()
        )
      );
  }

  getAllMetadatas() {
    return this.api.getAllMetadatas(this.currentUser)
      .then((allMetadatas) => this.currentUser.decryptAllMetadatas(allMetadatas));
  }
}

export default Secretin;
