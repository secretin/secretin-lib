import { assertPasswordComplexity } from './lib/owasp-password-strength-test';
import {
  WrappingError,
  UsernameAlreadyExistsError,
  NeedTOTPTokenError,
  DontHaveSecretError,
  OfflineError,
  LocalStorageUnavailableError,
  FriendNotFoundError,
  NotAvailableError,
  UserNotFoundError,
  InvalidPasswordError,
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
  generateRescueCodes,
  xorRescueCode,
} from './lib/utils';

import APIStandalone from './API/Standalone';
import User from './User';

class Secretin {
  constructor(cryptoAdapter, API = APIStandalone, db = undefined) {
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
    setTimeout(async () => {
      try {
        await this.oldApi.isOnline();
        this.api = this.oldApi;
        this.editableDB = true;
        this.dispatchEvent('connectionChange', { connection: 'online' });
        if (
          typeof this.currentUser.username !== 'undefined' &&
          typeof window.process !== 'undefined'
        ) {
          this.getDb().then(() => this.doCacheActions());
        }
      } catch (err) {
        if (err instanceof OfflineError) {
          this.testOnline();
        } else {
          throw err;
        }
      }
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

  async doCacheActions() {
    const cacheActionsKey = `${SecretinPrefix}cacheActions_${this.currentUser.username}`;
    const cacheActionsStr = localStorage.getItem(cacheActionsKey);
    const cacheActions = cacheActionsStr ? JSON.parse(cacheActionsStr) : [];
    for (const cacheAction of cacheActions) {
      switch (cacheAction.action) {
        case 'addSecret': {
          await this.api.addSecret(this.currentUser, cacheAction.args[0]);
          this.currentUser.keys[cacheAction.args[0].hashedTitle] = {
            key: cacheAction.args[0].wrappedKey,
            rights: 2,
          };
          const metadatas = await this.cryptoAdapter.decryptRSAOAEP(
            cacheAction.args[1],
            this.currentUser.privateKey
          );
          this.currentUser.metadatas[cacheAction.args[0].hashedTitle] =
            metadatas;
          this.popCacheAction();
          break;
        }
        case 'editSecret': {
          const secretId = this.getConflict(cacheAction.args[0]);
          const encryptedContent = cacheAction.args[1];
          const content = await this.cryptoAdapter.decryptRSAOAEP(
            encryptedContent,
            this.currentUser.privateKey
          );

          if (typeof this.currentUser.keys[secretId] === 'undefined') {
            const conflictSecretId = await this.addSecret(
              `${content.title} (Conflict)`,
              content.secret
            );
            this.setConflict(cacheAction.args[0], conflictSecretId);
          } else {
            await this.editSecret(secretId, content.secret);
          }

          this.popCacheAction();
          break;
        }
        case 'renameSecret': {
          const secretId = this.getConflict(cacheAction.args[0]);
          const encryptedContent = cacheAction.args[1];
          const content = await this.cryptoAdapter.decryptRSAOAEP(
            encryptedContent,
            this.currentUser.privateKey
          );

          if (typeof this.currentUser.keys[secretId] === 'undefined') {
            const conflictSecretId = await this.addSecret(
              `${content.title} (Conflict)`,
              content.secret
            );
            this.setConflict(cacheAction.args[0], conflictSecretId);
          } else {
            await this.renameSecret(secretId, content.title);
          }
          this.popCacheAction();
          break;
        }
        default: {
          // noop
        }
      }
    }
  }

  async newUser(username, password) {
    assertPasswordComplexity(password);
    if (!this.editableDB) {
      throw new OfflineError();
    }
    try {
      this.currentUser = new User(username, this.cryptoAdapter);
      const exists = await this.api.userExists(username);
      if (exists) {
        throw new UsernameAlreadyExistsError();
      }
      await this.currentUser.generateMasterKey();
      const objectPrivateKey = await this.currentUser.exportPrivateKey(
        password
      );

      const privateKey = objectPrivateKey.privateKey;
      const pass = objectPrivateKey.pass;
      pass.totp = false;
      pass.shortpass = false;

      const options = await this.currentUser.exportOptions();

      const publicKey = await this.currentUser.exportPublicKey();

      const { privateKeySign, publicKeySign } =
        await this.currentUser.exportKeyPairSign();

      await this.api.addUser({
        username: this.currentUser.username,
        privateKey,
        publicKey,
        privateKeySign,
        publicKeySign,
        pass,
        options,
      });

      if (typeof window.process !== 'undefined') {
        // Electron
        await this.getDb();
      }
      return this.currentUser;
    } catch (err) {
      if (err instanceof OfflineError) {
        this.offlineDB();
        throw err;
      }
      const wrapper = new WrappingError(err);
      throw wrapper.error;
    }
  }

  async loginUser(
    username,
    password,
    otp,
    progress = defaultProgress,
    forceSync = true
  ) {
    try {
      progress(new GetDerivationStatus());
      const parameters = await this.api.getDerivationParameters(username);
      if (parameters.totp && (typeof otp === 'undefined' || otp === '')) {
        throw new NeedTOTPTokenError();
      }
      progress(new PasswordDerivationStatus());
      const { hash, key } = await this.cryptoAdapter.derivePassword(
        password,
        parameters
      );
      progress(new GetUserStatus());
      const remoteUser = await this.api.getUser(username, hash, otp);

      this.currentUser = new User(username, this.cryptoAdapter);
      this.currentUser.totp = parameters.totp;
      this.currentUser.hash = hash;
      progress(new DecryptPrivateKeyStatus());
      await this.currentUser.importPrivateKey(key, remoteUser.privateKey);

      progress(new ImportPublicKeyStatus());
      await this.currentUser.importPublicKey(remoteUser.publicKey);
      if (!remoteUser.publicKeySign || !remoteUser.privateKeySign) {
        // Legacy bad practice
        await this.currentUser.deprecatedConvertOAEPToPSS();
      } else {
        await this.currentUser.importKeyPairSign({
          privateKeySign: remoteUser.privateKeySign,
          publicKeySign: remoteUser.publicKeySign,
        });
      }

      const shortpass = localStorage.getItem(`${SecretinPrefix}shortpass`);
      const signature = localStorage.getItem(
        `${SecretinPrefix}shortpassSignature`
      );
      if (shortpass && signature) {
        await this.currentUser.importPrivateData(shortpass, signature);
      }

      if (shortpass && this.editableDB) {
        const deviceName = localStorage.getItem(`${SecretinPrefix}deviceName`);
        await this.activateShortLogin(shortpass, deviceName);
      }
      await this.refreshUser(forceSync, progress);
      if (typeof window.process !== 'undefined') {
        // Electron
        await this.getDb();
        if (this.editableDB) {
          await this.doCacheActions();
        }
      }
      return this.currentUser;
    } catch (err) {
      if (err instanceof OfflineError) {
        this.offlineDB(username);
        return await this.loginUser(username, password, otp, progress);
      }
      const wrapper = new WrappingError(err);
      throw wrapper.error;
    }
  }

  async updateMetadataCache(newMetadata, progress = defaultProgress) {
    const metadata = await this.currentUser.decryptAllMetadatas(
      newMetadata,
      progress
    );

    this.currentUser.metadatas = metadata;
    progress(new EndDecryptMetadataStatus());
    const objectMetadataCache = await this.currentUser.exportBigPrivateData(
      metadata
    );

    return await this.api.editUser(this.currentUser, objectMetadataCache);
  }

  async refreshUser(rForceUpdate = false, progress = defaultProgress) {
    let forceUpdate = rForceUpdate;
    try {
      const remoteUser = await this.api.getUserWithSignature(this.currentUser);

      this.currentUser.keys = remoteUser.keys;
      if (typeof window.process !== 'undefined') {
        // Electron
        await this.getDb();
      }

      progress(new DecryptUserOptionsStatus());
      await this.currentUser.importOptions(remoteUser.options);
      if (typeof remoteUser.metadataCache !== 'undefined') {
        progress(new DecryptMetadataCacheStatus());
        this.currentUser.metadatas =
          await this.currentUser.importBigPrivateData(remoteUser.metadataCache);
      } else {
        forceUpdate = true;
      }

      if (forceUpdate) {
        await this.updateMetadataCache(remoteUser.metadatas, progress);
      } else {
        this.updateMetadataCache(remoteUser.metadatas, progress);
      }
      return true;
    } catch (err) {
      if (err instanceof OfflineError) {
        this.offlineDB();
        return await this.refreshUser(rForceUpdate, progress);
      }
      const wrapper = new WrappingError(err);
      throw wrapper.error;
    }
  }

  async addFolder(title, inFolderId) {
    return await this.addSecret(title, {}, inFolderId, 'folder');
  }

  async addSecret(clearTitle, content, inFolderId, type = 'secret') {
    try {
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

      const secretObject = await this.currentUser.createSecret(
        metadatas,
        content
      );

      const hashedTitle = secretObject.hashedTitle;
      this.currentUser.keys[secretObject.hashedTitle] = {
        key: secretObject.wrappedKey,
        rights: metadatas.users[this.currentUser.username].rights,
      };
      if (!this.editableDB) {
        const encryptedMetadatas = await this.cryptoAdapter.encryptRSAOAEP(
          metadatas,
          this.currentUser.publicKey
        );

        this.pushCacheAction('addSecret', [secretObject, encryptedMetadatas]);
      }

      await this.api.addSecret(this.currentUser, secretObject);

      this.currentUser.metadatas[hashedTitle] = metadatas;
      if (typeof inFolderId !== 'undefined') {
        await this.addSecretToFolder(hashedTitle, inFolderId);
      }

      if (typeof window.process !== 'undefined') {
        // Electron
        await this.getDb();
      }

      return hashedTitle;
    } catch (err) {
      if (err instanceof OfflineError) {
        this.offlineDB();
        return await this.addSecret(clearTitle, content, inFolderId, type);
      }
      const wrapper = new WrappingError(err);
      throw wrapper.error;
    }
  }

  async changePassword(password, oldPassword) {
    assertPasswordComplexity(password);
    if (!this.editableDB) {
      throw new OfflineError();
    }
    try {
      const parameters = await this.api.getDerivationParameters(
        this.currentUser.username
      );
      const { hash } = await this.cryptoAdapter.derivePassword(
        oldPassword,
        parameters
      );

      // eslint-disable-next-line security/detect-possible-timing-attacks
      if (hash !== this.currentUser.hash) {
        throw new InvalidPasswordError();
      }

      const objectPrivateKey = await this.currentUser.exportPrivateKey(
        password
      );

      await this.api.editUser(this.currentUser, {
        ...objectPrivateKey,
        oldHash: hash,
      });

      if (typeof window.process !== 'undefined') {
        // Electron
        await this.getDb();
      }
    } catch (err) {
      if (err instanceof OfflineError) {
        this.offlineDB();
        throw err;
      }
      const wrapper = new WrappingError(err);
      throw wrapper.error;
    }
  }

  async editSecret(hashedTitle, content) {
    try {
      const history = await this.api.getHistory(this.currentUser, hashedTitle);

      const secretObject = await this.currentUser.editSecret(
        hashedTitle,
        content,
        history
      );

      if (!this.editableDB) {
        if (
          Object.keys(this.currentUser.metadatas[hashedTitle].users).length > 1
        ) {
          throw new OfflineError();
        }
        const args = [hashedTitle];
        const toEncrypt = {
          secret: content,
          title: this.currentUser.metadatas[hashedTitle].title,
        };
        const encryptedContent = await this.cryptoAdapter.encryptRSAOAEP(
          toEncrypt,
          this.currentUser.publicKey
        );

        args.push(encryptedContent);
        this.pushCacheAction('editSecret', args);
      }

      await this.api.editSecret(this.currentUser, secretObject, hashedTitle);

      if (typeof window.process !== 'undefined') {
        // Electron
        await this.getDb();
      }
      return true;
    } catch (err) {
      if (err instanceof OfflineError) {
        this.offlineDB();
        return await this.editSecret(hashedTitle, content);
      }
      const wrapper = new WrappingError(err);
      throw wrapper.error;
    }
  }

  async editOption(name, value) {
    if (!this.editableDB) {
      throw new OfflineError();
    }
    this.currentUser.options[name] = value;
    return await this.resetOptions();
  }

  async editOptions(options) {
    if (!this.editableDB) {
      throw new OfflineError();
    }
    this.currentUser.options = options;
    return await this.resetOptions();
  }

  async resetOptions() {
    if (!this.editableDB) {
      throw new OfflineError();
    }
    try {
      const encryptedOptions = await this.currentUser.exportOptions();

      await this.api.editUser(this.currentUser, encryptedOptions);

      if (typeof window.process !== 'undefined') {
        // Electron
        await this.getDb();
      }
    } catch (err) {
      if (err instanceof OfflineError) {
        this.offlineDB();
        throw err;
      }
      const wrapper = new WrappingError(err);
      throw wrapper.error;
    }
  }

  async addSecretToFolder(hashedSecretTitle, hashedFolder) {
    try {
      const folderMetadatas = this.currentUser.metadatas[hashedFolder];
      const secretMetadatas = this.currentUser.metadatas[hashedSecretTitle];
      const sharedSecretObjectsArray = [];
      for (const friendName of Object.keys(folderMetadatas.users)) {
        const friend = new User(friendName, this.cryptoAdapter);
        const publicKey = await this.api.getPublicKey(friend.username);
        await friend.importPublicKey(publicKey);
        const sharedSecretObjects = await this.getSharedSecretObjects(
          hashedSecretTitle,
          friend,
          folderMetadatas.users[friend.username].rights,
          [],
          true
        );
        sharedSecretObjectsArray.push(sharedSecretObjects);
      }

      const metadatasUsers = {};
      const commonParentToClean = [];
      const encryptedFolder = await this.api.getSecret(
        hashedFolder,
        this.currentUser
      );

      const folders = await this.currentUser.decryptSecret(
        hashedFolder,
        encryptedFolder
      );

      folders[hashedSecretTitle] = 1;
      await this.editSecret(hashedFolder, folders);

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
          throw new OfflineError();
        }
        await this.api.shareSecret(this.currentUser, fullSharedSecretObjects);
      }

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

      for (const hashedTitle of Object.keys(metadatasUsers)) {
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

        await this.resetMetadatas(hashedTitle);
      }

      for (const parentFolder of commonParentToClean) {
        if (parentFolder !== 'ROOT') {
          const encryptedParentFolder = await this.api.getSecret(
            parentFolder,
            this.currentUser
          );
          const parentFolders = await this.currentUser.decryptSecret(
            parentFolder,
            encryptedParentFolder
          );

          delete parentFolders[hashedSecretTitle];
          await this.editSecret(parentFolder, parentFolders);
        }
      }

      if (typeof window.process !== 'undefined') {
        // Electron
        await this.getDb();
      }
      return hashedSecretTitle;
    } catch (err) {
      if (err instanceof OfflineError) {
        this.offlineDB();
        return await this.addSecretToFolder(hashedSecretTitle, hashedFolder);
      }
      const wrapper = new WrappingError(err);
      throw wrapper.error;
    }
  }

  async getSharedSecretObjects(
    hashedTitle,
    friend,
    rights,
    fullSharedSecretObjects,
    addUsername = false,
    hashedFolder = undefined
  ) {
    try {
      const secretMetadatas = this.currentUser.metadatas[hashedTitle];
      if (typeof secretMetadatas === 'undefined') {
        throw new DontHaveSecretError();
      }

      if (secretMetadatas.type === 'folder') {
        const encryptedSecret = await this.api.getSecret(
          hashedTitle,
          this.currentUser
        );

        const secrets = await this.currentUser.decryptSecret(
          hashedTitle,
          encryptedSecret
        );

        for (const hash of Object.keys(secrets)) {
          await this.getSharedSecretObjects(
            hash,
            friend,
            rights,
            fullSharedSecretObjects,
            addUsername,
            hashedTitle
          );
        }
      }

      const secretObject = await this.currentUser.shareSecret(
        friend,
        this.currentUser.keys[hashedTitle].key,
        hashedTitle
      );

      const newSecretObject = secretObject;
      newSecretObject.rights = rights;
      newSecretObject.inFolder = hashedFolder;
      if (addUsername) {
        newSecretObject.username = friend.username;
      }
      fullSharedSecretObjects.push(newSecretObject);
      return fullSharedSecretObjects;
    } catch (err) {
      if (err instanceof OfflineError) {
        this.offlineDB();
        throw err;
      }
      const wrapper = new WrappingError(err);
      throw wrapper.error;
    }
  }

  async renameSecret(hashedTitle, newTitle) {
    try {
      this.currentUser.metadatas[hashedTitle].title = newTitle;
      if (!this.editableDB) {
        if (
          Object.keys(this.currentUser.metadatas[hashedTitle].users).length > 1
        ) {
          throw new OfflineError();
        }
        const args = [hashedTitle];

        const secret = await this.getSecret(hashedTitle);

        const toEncrypt = {
          secret,
          title: newTitle,
        };
        const encryptedContent = await this.cryptoAdapter.encryptRSAOAEP(
          toEncrypt,
          this.currentUser.publicKey
        );

        args.push(encryptedContent);
        return this.pushCacheAction('renameSecret', args);
      }
      await this.resetMetadatas(hashedTitle);
      return true;
    } catch (err) {
      if (err instanceof OfflineError) {
        this.offlineDB();
        return await this.renameSecret(hashedTitle, newTitle);
      }
      throw err;
    }
  }

  async resetMetadatas(hashedTitle) {
    try {
      const secret = await this.getSecret(hashedTitle);
      await this.editSecret(hashedTitle, secret);

      if (typeof window.process !== 'undefined') {
        // Electron
        await this.getDb();
      }
    } catch (err) {
      if (err instanceof OfflineError) {
        this.offlineDB();
        throw err;
      }
      const wrapper = new WrappingError(err);
      throw wrapper.error;
    }
  }

  async shareSecret(hashedTitle, friendName, sRights) {
    try {
      if (!this.editableDB) {
        throw new OfflineError();
      }
      const rights = parseInt(sRights, 10);
      const friend = new User(friendName, this.cryptoAdapter);
      const publicKey = await this.api.getPublicKey(friend.username);
      await friend.importPublicKey(publicKey);
      const sharedSecretObjects = await this.getSharedSecretObjects(
        hashedTitle,
        friend,
        rights,
        []
      );
      await this.api.shareSecret(this.currentUser, sharedSecretObjects);

      for (const sharedSecretObject of sharedSecretObjects) {
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

        await this.resetMetadatas(sharedSecretObject.hashedTitle);
      }

      if (typeof window.process !== 'undefined') {
        // Electron
        await this.getDb();
      }
      return this.currentUser.metadatas[hashedTitle];
    } catch (err) {
      if (err instanceof OfflineError) {
        this.offlineDB();
        throw err;
      }
      const wrapper = new WrappingError(err);
      if (wrapper.error instanceof UserNotFoundError) {
        throw new FriendNotFoundError();
      }
      throw wrapper.error;
    }
  }

  async unshareSecret(hashedTitle, friendName) {
    try {
      if (!this.editableDB) {
        throw new OfflineError();
      }

      const secretMetadatas = this.currentUser.metadatas[hashedTitle];
      if (typeof secretMetadatas === 'undefined') {
        throw new DontHaveSecretError();
      }
      if (secretMetadatas.type === 'folder') {
        await this.unshareFolderSecrets(hashedTitle, friendName);
      }

      const result = await this.api.unshareSecret(
        this.currentUser,
        [friendName],
        hashedTitle
      );
      if (result !== 'Secret unshared') {
        const wrapper = new WrappingError(result);
        throw wrapper.error;
      }
      delete secretMetadatas.users[friendName];
      await this.resetMetadatas(hashedTitle);
      await this.renewKey(hashedTitle);

      if (typeof window.process !== 'undefined') {
        // Electron
        await this.getDb();
      }

      return this.currentUser.metadatas[hashedTitle];
    } catch (err) {
      if (err instanceof OfflineError) {
        this.offlineDB();
        throw err;
      }
      const wrapper = new WrappingError(err);
      throw wrapper.error;
    }
  }

  async unshareFolderSecrets(hashedFolder, friendName) {
    try {
      if (!this.editableDB) {
        throw new OfflineError();
      }
      const encryptedSecret = await this.api.getSecret(
        hashedFolder,
        this.currentUser
      );

      const secrets = await this.currentUser.decryptSecret(
        hashedFolder,
        encryptedSecret
      );

      for (const hashedTitle of Object.keys(secrets)) {
        await this.unshareSecret(hashedTitle, friendName);
      }

      if (typeof window.process !== 'undefined') {
        // Electron
        await this.getDb();
      }
    } catch (err) {
      if (err instanceof OfflineError) {
        this.offlineDB();
        throw err;
      }
      const wrapper = new WrappingError(err);
      throw wrapper.error;
    }
  }

  async wrapKeyForFriend(hashedUsername, key) {
    try {
      if (!this.editableDB) {
        throw new OfflineError();
      }

      const publicKey = await this.api.getPublicKey(hashedUsername, true);

      const friend = new User(hashedUsername, this.cryptoAdapter);
      await friend.importPublicKey(publicKey);
      const friendWrappedKey = await this.currentUser.wrapKey(
        key,
        friend.publicKey
      );
      return {
        user: hashedUsername,
        key: friendWrappedKey,
      };
    } catch (err) {
      if (err instanceof OfflineError) {
        this.offlineDB();
        throw err;
      }
      const wrapper = new WrappingError(err);
      throw wrapper.error;
    }
  }

  async renewKey(hashedTitle) {
    try {
      if (!this.editableDB) {
        throw new OfflineError();
      }
      const encryptedSecret = await this.api.getSecret(
        hashedTitle,
        this.currentUser
      );
      const history = await this.api.getHistory(this.currentUser, hashedTitle);
      const rawSecret = await this.currentUser.decryptSecret(
        hashedTitle,
        encryptedSecret
      );
      const secretObject = await this.currentUser.encryptSecret(
        this.currentUser.metadatas[hashedTitle],
        rawSecret,
        history
      );

      const secret = {
        secret: secretObject.secret,
        iv: secretObject.iv,
        metadatas: secretObject.metadatas,
        iv_meta: secretObject.iv_meta,
        history: secretObject.history,
        iv_history: secretObject.iv_history,
      };

      const hashedCurrentUsername = secretObject.hashedUsername;

      const wrappedKeys = [];
      for (const hashedUsername of encryptedSecret.users) {
        if (hashedCurrentUsername === hashedUsername) {
          const wrappedKey = await this.currentUser.wrapKey(
            secretObject.key,
            this.currentUser.publicKey
          );
          wrappedKeys.push({
            user: hashedCurrentUsername,
            key: wrappedKey,
          });
        } else {
          wrappedKeys.push(
            await this.wrapKeyForFriend(hashedUsername, secretObject.key)
          );
        }
      }

      await this.api.newKey(this.currentUser, hashedTitle, secret, wrappedKeys);

      wrappedKeys.forEach((wrappedKey) => {
        if (wrappedKey.user === hashedCurrentUsername) {
          this.currentUser.keys[hashedTitle].key = wrappedKey.key;
        }
      });

      if (typeof window.process !== 'undefined') {
        // Electron
        await this.getDb();
      }
    } catch (err) {
      if (err instanceof OfflineError) {
        this.offlineDB();
        throw err;
      }
      const wrapper = new WrappingError(err);
      throw wrapper.error;
    }
  }

  async removeSecretFromFolder(hashedTitle, hashedFolder) {
    try {
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

      if (usersToDelete.length > 1) {
        if (!this.editableDB) {
          throw new OfflineError();
        }
        await this.api.unshareSecret(
          this.currentUser,
          usersToDelete,
          hashedTitle
        );
      }

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
        await this.renewKey(hashedTitle);
      }

      await this.resetMetadatas(hashedTitle);
      const encryptedSecret = await this.api.getSecret(
        hashedFolder,
        this.currentUser
      );
      const folder = await this.currentUser.decryptSecret(
        hashedFolder,
        encryptedSecret
      );

      delete folder[hashedTitle];
      await this.editSecret(hashedFolder, folder);

      if (typeof window.process !== 'undefined') {
        // Electron
        await this.getDb();
      }
      return true;
    } catch (err) {
      if (err instanceof OfflineError) {
        this.offlineDB();
        return await this.removeSecretFromFolder(hashedTitle, hashedFolder);
      }
      const wrapper = new WrappingError(err);
      throw wrapper.error;
    }
  }

  async getSecret(hashedTitle) {
    try {
      const encryptedSecret = await this.api.getSecret(
        hashedTitle,
        this.currentUser
      );

      const secret = await this.currentUser.decryptSecret(
        hashedTitle,
        encryptedSecret
      );
      return secret;
    } catch (err) {
      if (err instanceof OfflineError) {
        this.offlineDB();
        return await this.getSecret(hashedTitle);
      }
      const wrapper = new WrappingError(err);
      throw wrapper.error;
    }
  }

  async getHistory(hashedTitle, index) {
    try {
      const encryptedHistory = await this.api.getHistory(
        this.currentUser,
        hashedTitle
      );
      const history = await this.currentUser.decryptSecret(
        hashedTitle,
        encryptedHistory
      );

      if (typeof index === 'undefined') {
        return history;
      }
      if (index < 0) {
        const diff = -index % history.length;
        return history[-diff];
      }
      return history[index % history.length];
    } catch (err) {
      if (err instanceof OfflineError) {
        this.offlineDB();
        return await this.getHistory(hashedTitle, index);
      }
      const wrapper = new WrappingError(err);
      throw wrapper.error;
    }
  }

  async deleteSecret(hashedTitle, list = []) {
    if (!this.editableDB) {
      throw new OfflineError();
    }
    try {
      const secretMetadatas = this.currentUser.metadatas[hashedTitle];
      if (typeof secretMetadatas === 'undefined') {
        throw new DontHaveSecretError();
      }
      if (
        secretMetadatas.type === 'folder' &&
        list.indexOf(hashedTitle) === -1
      ) {
        await this.deleteFolderSecrets(hashedTitle, list);
      }

      await this.api.deleteSecret(this.currentUser, hashedTitle);
      delete this.currentUser.metadatas[hashedTitle];
      delete this.currentUser.keys[hashedTitle];

      const currentUsername = this.currentUser.username;
      for (const hashedFolder of Object.keys(
        secretMetadatas.users[currentUsername].folders
      )) {
        if (hashedFolder !== 'ROOT') {
          const encryptedSecret = await this.api.getSecret(
            hashedFolder,
            this.currentUser
          );
          const folder = await this.currentUser.decryptSecret(
            hashedFolder,
            encryptedSecret
          );

          delete folder[hashedTitle];
          await this.editSecret(hashedFolder, folder);
        }
      }

      if (typeof window.process !== 'undefined') {
        // Electron
        await this.getDb();
      }
    } catch (err) {
      if (err instanceof OfflineError) {
        this.offlineDB();
        throw err;
      }
      const wrapper = new WrappingError(err);
      throw wrapper.error;
    }
  }

  async deleteFolderSecrets(hashedFolder, list) {
    if (!this.editableDB) {
      throw new OfflineError();
    }

    try {
      list.push(hashedFolder);
      const encryptedSecret = await this.api.getSecret(
        hashedFolder,
        this.currentUser
      );
      const secrets = await this.currentUser.decryptSecret(
        hashedFolder,
        encryptedSecret
      );

      for (const hashedTitle of Object.keys(secrets)) {
        await this.deleteSecret(hashedTitle, list);
      }

      if (typeof window.process !== 'undefined') {
        // Electron
        await this.getDb();
      }
    } catch (err) {
      if (err instanceof OfflineError) {
        this.offlineDB();
        throw err;
      }
      const wrapper = new WrappingError(err);
      throw wrapper.error;
    }
  }

  async deactivateTotp() {
    if (!this.editableDB) {
      throw new OfflineError();
    }

    try {
      await this.api.deactivateTotp(this.currentUser);
      if (typeof window.process !== 'undefined') {
        // Electron
        await this.getDb();
      }
    } catch (err) {
      if (err instanceof OfflineError) {
        this.offlineDB();
        throw err;
      }
      const wrapper = new WrappingError(err);
      throw wrapper.error;
    }
  }

  async activateTotp(seed) {
    if (!this.editableDB) {
      throw new OfflineError();
    }
    try {
      const protectedSeed = xorSeed(
        hexStringToUint8Array(this.currentUser.hash),
        seed.raw
      );
      await this.api.activateTotp(protectedSeed, this.currentUser);
      if (typeof window.process !== 'undefined') {
        // Electron
        await this.getDb();
      }
    } catch (err) {
      if (err instanceof OfflineError) {
        this.offlineDB();
      }
      const wrapper = new WrappingError(err);
      throw wrapper.error;
    }
  }

  async activateShortLogin(shortpass, deviceName) {
    if (!this.editableDB) {
      throw new OfflineError();
    }
    if (!localStorageAvailable()) {
      throw new LocalStorageUnavailableError();
    }
    try {
      const toSend = await this.currentUser.activateShortLogin(
        shortpass,
        deviceName
      );

      await this.api.activateShortLogin(toSend, this.currentUser);

      if (typeof window.process !== 'undefined') {
        // Electron
        await this.getDb();
      }

      const result = await this.currentUser.exportPrivateData(shortpass);

      localStorage.setItem(`${SecretinPrefix}shortpass`, result.data);
      localStorage.setItem(
        `${SecretinPrefix}shortpassSignature`,
        result.signature
      );
    } catch (err) {
      if (err instanceof OfflineError) {
        this.offlineDB();
        throw err;
      }
      const wrapper = new WrappingError(err);
      throw wrapper.error;
    }
  }

  // eslint-disable-next-line class-methods-use-this
  getShortLoginActivationDate() {
    if (!localStorageAvailable()) {
      throw new LocalStorageUnavailableError();
    }
    const dateStr = localStorage.getItem(`${SecretinPrefix}activatedAt`);
    return dateStr ? new Date(dateStr) : null;
  }

  // eslint-disable-next-line class-methods-use-this
  deactivateShortLogin() {
    if (!localStorageAvailable()) {
      throw new LocalStorageUnavailableError();
    }
    localStorage.removeItem(`${SecretinPrefix}username`);
    localStorage.removeItem(`${SecretinPrefix}deviceName`);
    localStorage.removeItem(`${SecretinPrefix}privateKey`);
    localStorage.removeItem(`${SecretinPrefix}privateKeyIv`);
    localStorage.removeItem(`${SecretinPrefix}iv`);
    localStorage.removeItem(`${SecretinPrefix}shortpass`);
    localStorage.removeItem(`${SecretinPrefix}shortpassSignature`);
    localStorage.removeItem(`${SecretinPrefix}activatedAt`);
  }

  async shortLogin(shortpass, progress = defaultProgress, forceSync = true) {
    if (!localStorageAvailable()) {
      throw new LocalStorageUnavailableError();
    }
    try {
      const username = localStorage.getItem(`${SecretinPrefix}username`);
      const deviceName = localStorage.getItem(`${SecretinPrefix}deviceName`);
      this.currentUser = new User(username, this.cryptoAdapter);
      progress(new GetDerivationStatus());
      const parameters = await this.api.getProtectKeyParameters(
        username,
        deviceName
      );

      this.currentUser.totp = parameters.totp;
      progress(new PasswordDerivationStatus());
      const { hash, key: shortpassKey } =
        await this.cryptoAdapter.derivePassword(shortpass, parameters);

      progress(new GetProtectKeyStatus());
      const protectKey = await this.api.getProtectKey(
        username,
        deviceName,
        hash
      );

      progress(new DecryptPrivateKeyStatus());
      await this.currentUser.shortLogin(shortpassKey, protectKey);

      progress(new ImportPublicKeyStatus());
      await this.currentUser.importPublicKey(parameters.publicKey);

      await this.refreshUser(forceSync, progress);

      if (typeof window.process !== 'undefined') {
        // Electron
        await this.getDb();
        if (this.editableDB) {
          await this.doCacheActions();
        }
      }
      return this.currentUser;
    } catch (err) {
      if (err instanceof OfflineError) {
        this.offlineDB();
        return await this.shortLogin(shortpass);
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
    }
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

  async getRescueCodes() {
    try {
      const rescueCodes = generateRescueCodes();
      const protectedRescueCodes = rescueCodes.map((rescueCode) =>
        xorRescueCode(
          hexStringToUint8Array(rescueCode),
          hexStringToUint8Array(this.currentUser.hash)
        )
      );
      await this.api.postRescueCodes(this.currentUser, protectedRescueCodes);
      return rescueCodes;
    } catch (err) {
      if (err instanceof OfflineError) {
        this.offlineDB();
        return await this.getRescueCodes();
      }
      const wrapper = new WrappingError(err);
      throw wrapper.error;
    }
  }

  async getDb() {
    if (!localStorageAvailable()) {
      throw new LocalStorageUnavailableError();
    }
    try {
      const cacheKey = `${SecretinPrefix}cache_${this.currentUser.username}`;
      const DbCacheStr = localStorage.getItem(cacheKey);
      const DbCache = DbCacheStr
        ? JSON.parse(DbCacheStr)
        : { users: {}, secrets: {} };
      const revs = {};
      Object.keys(DbCache.secrets).forEach((key) => {
        revs[key] = DbCache.secrets[key].rev;
      });
      const newDb = await this.api.getDb(this.currentUser, revs);

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
    } catch (err) {
      if (err instanceof OfflineError) {
        this.offlineDB();
        return await this.getDb();
      }
      const wrapper = new WrappingError(err);
      throw wrapper.error;
    }
  }

  async exportDb(password, oldPassword) {
    try {
      const db = await this.api.getDb(this.currentUser, {});
      const oldSecretin = new Secretin(
        this.cryptoAdapter,
        APIStandalone,
        JSON.parse(JSON.stringify(db))
      );

      if (typeof password === 'undefined') {
        db.username = this.currentUser.username;
        return JSON.stringify(db);
      }

      oldSecretin.currentUser = this.currentUser;
      await oldSecretin.changePassword(password, oldPassword);
      const newDb = await oldSecretin.api.getDb(oldSecretin.currentUser, {});
      newDb.username = this.currentUser.username;
      return JSON.stringify(newDb);
    } catch (err) {
      if (err instanceof OfflineError) {
        this.offlineDB();
        return await this.getDb();
      }
      const wrapper = new WrappingError(err);
      throw wrapper.error;
    }
  }

  async importDb(password, jsonDB, progress = defaultProgress) {
    if (!this.editableDB) {
      throw new OfflineError();
    }

    const oldDB = JSON.parse(jsonDB);
    const { username } = oldDB;
    const oldSecretin = new Secretin(this.cryptoAdapter, APIStandalone, oldDB);
    const newHashedTitles = {};
    const parameters = await oldSecretin.api.getDerivationParameters(username);
    const { hash, key } = await this.cryptoAdapter.derivePassword(
      password,
      parameters
    );

    const remoteUser = await oldSecretin.api.getUser(username, hash);

    oldSecretin.currentUser = new User(username, this.cryptoAdapter);
    oldSecretin.currentUser.totp = parameters.totp;
    oldSecretin.currentUser.hash = hash;
    await oldSecretin.currentUser.importPrivateKey(key, remoteUser.privateKey);
    await oldSecretin.currentUser.importPublicKey(remoteUser.publicKey);
    const user = await oldSecretin.api.getUserWithSignature(
      oldSecretin.currentUser
    );
    const encryptedMetadata = user.metadatas;
    oldSecretin.currentUser.keys = user.keys;
    for (const hashedTitle of Object.keys(oldSecretin.currentUser.keys)) {
      const now = Date.now();
      const saltedTitle = `${now}|${hashedTitle}`;
      const newHashedTitle = await this.cryptoAdapter.getSHA256(saltedTitle);
      newHashedTitles[hashedTitle] = newHashedTitle;
    }

    const hashedTitles = Object.keys(oldSecretin.currentUser.keys);
    const progressStatus = new ImportSecretStatus(0, hashedTitles.length);
    progress(progressStatus);

    for (const hashedTitle of hashedTitles) {
      const encryptedSecret = await oldSecretin.api.getSecret(
        hashedTitle,
        oldSecretin.currentUser
      );

      const encryptedHistory = await oldSecretin.api.getHistory(
        oldSecretin.currentUser,
        hashedTitle
      );

      const { secret, metadata, history } =
        await oldSecretin.currentUser.exportSecret(
          hashedTitle,
          encryptedSecret,
          encryptedMetadata[hashedTitle],
          encryptedHistory
        );

      const newMetadata = metadata;
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

      const secretObject = await this.currentUser.importSecret(
        newHashedTitles[hashedTitle],
        newSecret,
        newMetadata,
        history
      );

      this.currentUser.keys[secretObject.hashedTitle] = {
        key: secretObject.wrappedKey,
        rights: newMetadata.users[this.currentUser.username].rights,
      };
      this.currentUser.metadatas[secretObject.hashedTitle] = newMetadata;
      await this.api.addSecret(this.currentUser, secretObject);

      progressStatus.step();
      progress(progressStatus);
    }
  }
}

export default Secretin;
