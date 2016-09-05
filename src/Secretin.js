import API from './APIAlone';
import User from './User';


// ###################### secretin.js ######################

const Secretin = function () {
  this.api = new API();
  this.currentUser = {};
};

Secretin.prototype.changeDB = function (db) {
  this.api = new API(db);
};

Secretin.prototype.newUser = function (username, password) {
  const _this = this;
  return _this.api.userExists(username).then(function (exists) {
    if (!exists) {
      const result = {};
      const pass = {};
      _this.currentUser = new User(username);
      return _this.currentUser.generateMasterKey().then(function () {
        return derivePassword(password);
      }).then(function (dKey) {
        pass.salt = bytesToHexString(dKey.salt);
        pass.hash = bytesToHexString(dKey.hash);
        pass.iterations = dKey.iterations;
        _this.currentUser.hash = pass.hash;
        return _this.currentUser.exportPrivateKey(dKey.key);
      }).then(function (privateKey) {
        result.privateKey = privateKey;
        return _this.currentUser.exportPublicKey();
      }).then(function (publicKey) {
        result.publicKey = publicKey;
        return _this.api.addUser(_this.currentUser.username, result.privateKey, result.publicKey, pass);
      }, function (err) {
        throw (err);
      });
    }
    else {
      throw ('Username already exists');
    }
  });
};

Secretin.prototype.getKeys = function (username, password) {
  const _this = this;
  return _this.api.getDerivationParameters(username).then(function (parameters) {
    return derivePassword(password, parameters);
  }).then(function (dKey) {
    key = dKey.key;
    hash = bytesToHexString(dKey.hash);
    return _this.api.getUser(username, hash);
  }).then(function (user) {
    _this.currentUser = new User(username);
    remoteUser = user;
    _this.currentUser.keys = remoteUser.keys;
    _this.currentUser.hash = hash;
    return _this.currentUser.importPublicKey(remoteUser.publicKey);
  }).then(function () {
    return _this.currentUser.importPrivateKey(key, remoteUser.privateKey);
  }, function (err) {
    throw (err);
  });
};

Secretin.prototype.refreshKeys = function () {
  const _this = this;
  return _this.api.getKeysWithToken(_this.currentUser).then(function (keys) {
    _this.currentUser.keys = keys;
    return keys;
  }, function (err) {
    throw (err);
  });
};

Secretin.prototype.addSecret = function (metadatas, content) {
  const _this = this;
  let hashedTitle;
  return new Promise(function (resolve, reject) {
    metadatas.users = {};
    metadatas.folders = {};
    if (typeof (_this.currentUser.currentFolder) !== 'undefined') {
      metadatas.users[_this.currentUser.username] = { rights: _this.currentUser.keys[_this.currentUser.currentFolder].rights };
    }
    else {
      metadatas.users[_this.currentUser.username] = { rights: 2 };
    }

    if (typeof (_this.currentUser.username) === 'string') {
      return _this.currentUser.createSecret(metadatas, content).then(function (secretObject) {
        hashedTitle = secretObject.hashedTitle;
        return _this.api.addSecret(_this.currentUser, secretObject);
      }).then(function (msg) {
        return _this.refreshKeys();
      }).then(function () {
        return _this.getAllMetadatas();
      }).then(function () {
        if (typeof (_this.currentUser.currentFolder) !== 'undefined') {
          resolve(_this.addSecretToFolder(hashedTitle, _this.currentUser.currentFolder));
        }
        else {
          resolve();
        }
      }, function (err) {
        throw (err);
      });
    }
    else {
      throw ('You are disconnected');
    }
  });
};

Secretin.prototype.changePassword = function (password) {
  const _this = this;
  const pass = {};
  return derivePassword(password).then(function (dKey) {
    pass.salt = bytesToHexString(dKey.salt);
    pass.hash = bytesToHexString(dKey.hash);
    pass.iterations = dKey.iterations;
    return _this.currentUser.exportPrivateKey(dKey.key);
  }).then(function (privateKey) {
    return _this.api.changePassword(_this.currentUser, privateKey, pass);
  }, function (err) {
    throw (err);
  });
};

Secretin.prototype.editSecret = function (hashedTitle, metadatas, content) {
  const _this = this;
  return _this.currentUser.editSecret(metadatas, content, _this.currentUser.keys[hashedTitle].key).then(function (secretObject) {
    return _this.api.editSecret(_this.currentUser, secretObject, hashedTitle);
  }, function (err) {
    throw (err);
  });
};

Secretin.prototype.addSecretToFolder = function (hashedSecretTitle, hashedFolder) {
  const _this = this;
  let sharedSecretObjectsPromises = [];
  Object.keys(_this.currentUser.metadatas[hashedFolder].users).forEach(function (friendName) {
    sharedSecretObjectsPromises = sharedSecretObjectsPromises.concat(
      (function () {
        const friend = new User(friendName);
        return _this.api.getPublicKey(friend.username).then(function (publicKey) {
          return friend.importPublicKey(publicKey);
        }).then(function () {
          return _this.getSharedSecretObjects(hashedSecretTitle, friend, _this.currentUser.metadatas[hashedFolder].users[friend.username].rights, []);
        });
      })()
    );
  });

  const metadatasUsers = {};
  return Promise.all(sharedSecretObjectsPromises).then(function (sharedSecretObjectsArray) {
    const fullSharedSecretObjects = [];
    sharedSecretObjectsArray.forEach(function (sharedSecretObjects) {
      sharedSecretObjects.forEach(function (sharedSecretObject) {
        if (typeof (metadatasUsers[sharedSecretObject.hashedTitle]) === 'undefined') {
          metadatasUsers[sharedSecretObject.hashedTitle] = [];
        }
        metadatasUsers[sharedSecretObject.hashedTitle].push({ friendName: sharedSecretObject.username, folder: sharedSecretObject.inFolder });
        delete sharedSecretObject.inFolder;
        if (_this.currentUser.username !== sharedSecretObject.username) {
          delete sharedSecretObject.username;
          fullSharedSecretObjects.push(sharedSecretObject);
        }
      });
    });
    return _this.api.shareSecret(_this.currentUser, fullSharedSecretObjects);
  }).then(function () {
    const resetMetaPromises = [];
    if (typeof (_this.currentUser.currentFolder) !== 'undefined') {
      delete _this.currentUser.metadatas[hashedSecretTitle].folders[_this.currentUser.currentFolder];
    }
    _this.currentUser.metadatas[hashedSecretTitle].folders[hashedFolder] = { name: _this.currentUser.metadatas[hashedFolder].title };
    Object.keys(metadatasUsers).forEach(function (hashedTitle) {
      metadatasUsers[hashedTitle].forEach(function (infos) {
        const metaUser = { rights: _this.currentUser.metadatas[hashedFolder].users[infos.friendName].rights };
        if (typeof (infos.folder) === 'undefined') {
          metaUser.folder = _this.currentUser.metadatas[hashedFolder].title;
        }
        else {
          metaUser.folder = infos.folder;
        }
        if (infos.friendName === _this.currentUser.username) {
          if (typeof (_this.currentUser.currentFolder) === 'undefined') {
            metaUser.rights = 2;
          }
          else {
            metaUser.rights = _this.currentUser.keys[_this.currentUser.currentFolder].rights;
          }
        }
        _this.currentUser.metadatas[hashedTitle].users[infos.friendName] = metaUser;
      });

      resetMetaPromises.push(_this.resetMetadatas(hashedTitle));
    });
    return Promise.all(resetMetaPromises);
  }).then(function () {
    return _this.api.getSecret(hashedFolder, _this.currentUser);
  }).then(function (encryptedSecret) {
    return _this.currentUser.decryptSecret(encryptedSecret, _this.currentUser.keys[hashedFolder].key);
  }).then(function (secret) {
    const folder = JSON.parse(secret);
    folder[hashedSecretTitle] = 1;
    return _this.editSecret(hashedFolder, _this.currentUser.metadatas[hashedFolder], folder);
  });
};

Secretin.prototype.getSharedSecretObjects = function (hashedTitle, friend, rights, fullSharedSecretObjects, folderName) {
  const _this = this;
  let isFolder = Promise.resolve();
  const sharedSecretObjectPromises = [];
  if (typeof (_this.currentUser.metadatas[hashedTitle].type) !== 'undefined' && _this.currentUser.metadatas[hashedTitle].type === 'folder') {
    isFolder = isFolder.then(function () {
      return _this.api.getSecret(hashedTitle, _this.currentUser).then(function (encryptedSecret) {
        return _this.currentUser.decryptSecret(encryptedSecret, _this.currentUser.keys[hashedTitle].key);
      }).then(function (secrets) {
        Object.keys(JSON.parse(secrets)).forEach(function (hash) {
          sharedSecretObjectPromises.push(_this.getSharedSecretObjects(hash, friend, rights, fullSharedSecretObjects, _this.currentUser.metadatas[hashedTitle].title));
        });
        return Promise.all(sharedSecretObjectPromises);
      });
    });
  }

  return isFolder.then(function () {
    return _this.currentUser.shareSecret(friend, _this.currentUser.keys[hashedTitle].key, hashedTitle);
  }).then(function (secretObject) {
    secretObject.rights = rights;
    secretObject.inFolder = folderName;
    secretObject.username = friend.username;
    fullSharedSecretObjects.push(secretObject);
    return fullSharedSecretObjects;
  }, function (err) {
    throw (err);
  });
};

Secretin.prototype.resetMetadatas = function (hashedTitle) {
  const _this = this;
  let secretObject;
  return _this.api.getSecret(hashedTitle, _this.currentUser).then(function (encryptedSecret) {
    return _this.currentUser.decryptSecret(encryptedSecret, _this.currentUser.keys[hashedTitle].key);
  }).then(function (secret) {
    secretObject = JSON.parse(secret);
    return _this.editSecret(hashedTitle, _this.currentUser.metadatas[hashedTitle], secretObject);
  });
};

Secretin.prototype.shareSecret = function (hashedTitle, friendName, rights, type) {
  const _this = this;
  if (type === 'folder') {
    return new Promise(function (resolve, reject) {
      let hashedFolder = false;
      Object.keys(_this.currentUser.metadatas).forEach(function (hash) {
        if (typeof (_this.currentUser.metadatas[hash].type) !== 'undefined' && _this.currentUser.metadatas[hash].type === 'folder' && _this.currentUser.metadatas[hash].title === friendName) {
          hashedFolder = hash;
        }
      });
      if (hashedFolder === false) {
        reject('Folder not found');
      }
      else {
        if (hashedTitle === hashedFolder) {
          reject('You can\'t put this folder in itself.');
        }
        else {
          resolve(_this.addSecretToFolder(hashedTitle, hashedFolder));
        }
      }
    });
  }
  else {
    let sharedSecretObjects;
    const friend = new User(friendName);
    return _this.api.getPublicKey(friend.username).then(function (publicKey) {
      return friend.importPublicKey(publicKey);
    }).then(function () {
      return _this.getSharedSecretObjects(hashedTitle, friend, rights, []);
    }).then(function (rSharedSecretObjects) {
      sharedSecretObjects = rSharedSecretObjects;
      return _this.api.shareSecret(_this.currentUser, sharedSecretObjects);
    }).then(function () {
      const resetMetaPromises = [];
      sharedSecretObjects.forEach(function (sharedSecretObject) {
        _this.currentUser.metadatas[sharedSecretObject.hashedTitle].users[friend.username] = { rights };
        if (typeof (sharedSecretObject.inFolder) !== 'undefined') {
          _this.currentUser.metadatas[sharedSecretObject.hashedTitle].users[friend.username].folder = sharedSecretObject.inFolder;
        }
        resetMetaPromises.push(_this.resetMetadatas(sharedSecretObject.hashedTitle));
      });
      return Promise.all(resetMetaPromises);
    }, function (err) {
      throw (err);
    });
  }
};

Secretin.prototype.shareFolderSecrets = function (hashedFolder, friend, rights) {
  const _this = this;
  const shareSecretPromises = [];
  secretList.forEach(function (hashedTitle) {
    if (typeof (_this.currentUser.metadatas[hashedTitle]) !== 'undefined') {
      shareSecretPromises.push(
        _this.currentUser.shareSecret(friend, _this.currentUser.keys[hashedTitle].key, hashedTitle).then(function (sharedSecretObject) {
          sharedSecretObject.rights = rights;
          return sharedSecretObject;
        })
      );
    }
  });
  return Promise.all(shareSecretPromises).then(function (sharedSecretObjects) {
    return _this.api.shareSecret(_this.currentUser, sharedSecretObjects);
  }).then(function () {
    const resetMetaPromises = [];
    secretList.forEach(function (hashedTitle) {
      _this.currentUser.metadatas[hashedTitle].users[friend.username] = { rights, folder: _this.currentUser.metadatas[hashedFolder].title };
      resetMetaPromises.push(_this.resetMetadatas(hashedTitle));
    });
    return Promise.all(resetMetaPromises);
  });
};

Secretin.prototype.unshareSecret = function (hashedTitle, friendName) {
  const _this = this;
  const secret = {};
  let isFolder = Promise.resolve();
  if (typeof (_this.currentUser.metadatas[hashedTitle].type) !== 'undefined' && _this.currentUser.metadatas[hashedTitle].type === 'folder') {
    isFolder = isFolder.then(function () {
      return _this.unshareFolderSecrets(hashedTitle, friendName);
    });
  }

  return isFolder.then(function () {
    return _this.api.unshareSecret(_this.currentUser, [friendName], hashedTitle);
  }).then(function () {
    delete _this.currentUser.metadatas[hashedTitle].users[friendName];
    return _this.resetMetadatas(hashedTitle);
  }).then(function () {
    return _this.renewKey(hashedTitle);
  }, function (err) {
    if (err.status === 'Desync') {
      delete _this.currentUser.metadatas[err.datas.title].users[err.datas.friendName];
      return _this.resetMetadatas(hashedTitle);
    }
    else {
      throw (err);
    }
  });
};

Secretin.prototype.unshareFolderSecrets = function (hashedFolder, friendName, friendName2) {
  const _this = this;
  return _this.api.getSecret(hashedFolder, _this.currentUser).then(function (encryptedSecret) {
    return _this.currentUser.decryptSecret(encryptedSecret, _this.currentUser.keys[hashedFolder].key);
  }).then(function (secrets) {
    return Object.keys(JSON.parse(secrets)).reduce(function (promise, hashedTitle) {
      return promise.then(function () {
        return _this.unshareSecret(hashedTitle, friendName);
      });
    }, Promise.resolve());
  });
};

Secretin.prototype.wrapKeyForFriend = function (hashedUsername, key) {
  const _this = this;
  let friend;
  return _this.api.getPublicKey(hashedUsername, true).then(function (publicKey) {
    friend = new User(hashedUsername);
    return friend.importPublicKey(publicKey);
  }).then(function () {
    return _this.currentUser.wrapKey(key, friend.publicKey);
  }).then(function (friendWrappedKey) {
    return { user: hashedUsername, key: friendWrappedKey };
  });
};

Secretin.prototype.renewKey = function (hashedTitle) {
  const _this = this;
  let encryptedSecret;
  const secret = {};
  return _this.api.getSecret(hashedTitle, _this.currentUser).then(function (eSecret) {
    encryptedSecret = eSecret;
    return _this.currentUser.decryptSecret(encryptedSecret, _this.currentUser.keys[hashedTitle].key);
  }).then(function (secret) {
    return _this.currentUser.encryptSecret(_this.currentUser.metadatas[hashedTitle], JSON.parse(secret));
  }).then(function (secretObject) {
    secret.secret = secretObject.secret;
    secret.iv = secretObject.iv;
    secret.metadatas = secretObject.metadatas;
    secret.iv_meta = secretObject.iv_meta;
    const wrappedKeysPromises = [];
    encryptedSecret.users.forEach(function (hashedUsername) {
      wrappedKeysPromises.push(_this.wrapKeyForFriend(hashedUsername, secretObject.key));
    });

    return Promise.all(wrappedKeysPromises);
  }).then(function (wrappedKeys) {
    return _this.api.newKey(_this.currentUser, hashedTitle, secret, wrappedKeys);
  }, function (err) {
    throw (err);
  });
};

Secretin.prototype.removeSecretFromFolder = function (hashedTitle, hashedFolder) {
  const _this = this;
  const folderName = _this.currentUser.metadatas[hashedTitle].folders[hashedFolder].name;
  const usersToDelete = [];
  Object.keys(_this.currentUser.metadatas[hashedTitle].users).forEach(function (username) {
    const user = _this.currentUser.metadatas[hashedTitle].users[username];
    if (typeof (user.folder) !== 'undefined' && user.folder === folderName) {
      usersToDelete.push(username);
    }
  });
  return _this.api.unshareSecret(_this.currentUser, usersToDelete, hashedTitle).then(function () {
    usersToDelete.forEach(function (username) {
      if (username !== _this.currentUser.username) {
        delete _this.currentUser.metadatas[hashedTitle].users[username];
      }
      else {
        delete _this.currentUser.metadatas[hashedTitle].users[username].folder;
      }
    });
    delete _this.currentUser.metadatas[hashedTitle].folders[hashedFolder];
    return _this.renewKey(hashedTitle);
  }).then(function () {
    return _this.api.getSecret(hashedFolder, _this.currentUser);
  }).then(function (encryptedSecret) {
    return _this.currentUser.decryptSecret(encryptedSecret, _this.currentUser.keys[hashedFolder].key);
  }).then(function (secret) {
    const folder = JSON.parse(secret);
    delete folder[hashedTitle];
    return _this.editSecret(hashedFolder, _this.currentUser.metadatas[hashedFolder], folder);
  }, function (err) {
    throw (err);
  });
};

Secretin.prototype.getSecret = function (hashedTitle) {
  const _this = this;
  return _this.api.getSecret(hashedTitle, _this.currentUser).then(function (rEncryptedSecret) {
    const encryptedSecret = { secret: rEncryptedSecret.secret, iv: rEncryptedSecret.iv };
    return _this.currentUser.decryptSecret(encryptedSecret, _this.currentUser.keys[hashedTitle].key);
  });
};

Secretin.prototype.deleteSecret = function (hashedTitle) {
  const _this = this;
  const wasLast = false;
  let isFolder = Promise.resolve();
  if (typeof (_this.currentUser.metadatas[hashedTitle].type) !== 'undefined' && _this.currentUser.metadatas[hashedTitle].type === 'folder') {
    isFolder = isFolder.then(function () {
      return _this.deleteFolderSecrets(hashedTitle);
    });
  }

  return isFolder.then(function () {
    delete _this.currentUser.metadatas[hashedTitle].users[_this.currentUser.username];
    return _this.resetMetadatas(hashedTitle);
  }).then(function () {
    return _this.api.deleteSecret(_this.currentUser, hashedTitle);
  }).then(function (wasLast) {
    const editFolderPromises = [];
    Object.keys(_this.currentUser.metadatas[hashedTitle].folders).forEach(function (hashedFolder) {
      editFolderPromises.push(
        _this.api.getSecret(hashedFolder, _this.currentUser).then(function (encryptedSecret) {
          return _this.currentUser.decryptSecret(encryptedSecret, _this.currentUser.keys[hashedFolder].key);
        }).then(function (secret) {
          const folder = JSON.parse(secret);
          delete folder[hashedTitle];
          return _this.editSecret(hashedFolder, _this.currentUser.metadatas[hashedFolder], folder);
        })
      );
    });
    return Promise.all(editFolderPromises);
  }, function (err) {
    throw (err);
  });
};

Secretin.prototype.deleteFolderSecrets = function (hashedFolder) {
  const _this = this;
  return _this.api.getSecret(hashedFolder, _this.currentUser).then(function (encryptedSecret) {
    return _this.currentUser.decryptSecret(encryptedSecret, _this.currentUser.keys[hashedFolder].key);
  }).then(function (secrets) {
    return Object.keys(JSON.parse(secrets)).reduce(function (promise, hashedTitle) {
      return promise.then(function () {
        return _this.deleteSecret(hashedTitle);
      });
    }, Promise.resolve());
  });
};

Secretin.prototype.getAllMetadatas = function () {
  const _this = this;
  return _this.api.getAllMetadatas(_this.currentUser).then(function (allMetadatas) {
    return _this.currentUser.decryptAllMetadatas(allMetadatas);
  }, function (err) {
    throw (err);
  });
};

export default Secretin;
