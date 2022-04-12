var Secretin = (function () {
  'use strict';

  var version = "2.3.2";

  /* eslint-disable max-classes-per-file */
  class Error {
    constructor(errorObject) {
      this.message = 'Unknown error';
      if (typeof errorObject !== 'undefined') {
        this.errorObject = errorObject;
      } else {
        this.errorObject = null;
      }
    }
  }

  class XorSeedError extends Error {
    constructor() {
      super();
      this.message = 'Utils.xorSeed expect 32 bytes Uint8Arrays';
    }
  }
  class InvalidHexStringError extends Error {
    constructor() {
      super();
      this.message = 'Invalid hexString';
    }
  }

  class SomethingGoesWrong extends Error {
    constructor() {
      super();
      this.message = 'Something goes wrong.';
    }
  }

  class ServerUnknownError extends Error {
    constructor() {
      super();
      this.message = 'Server error';
    }
  }

  class UserNotFoundError extends Error {
    constructor() {
      super();
      this.message = 'User not found';
    }
  }

  class UsernameAlreadyExistsError extends Error {
    constructor() {
      super();
      this.message = 'Username already exists';
    }
  }

  class NeedTOTPTokenError extends Error {
    constructor() {
      super();
      this.message = 'Need TOTP token';
    }
  }

  class DisconnectedError extends Error {
    constructor() {
      super();
      this.message = 'You are disconnected';
    }
  }

  class InvalidSignatureError extends Error {
    constructor() {
      super();
      this.message = 'Invalid signature';
    }
  }

  class DontHaveSecretError extends Error {
    constructor() {
      super();
      this.message = "You don't have this secret";
    }
  }

  class FolderNotFoundError extends Error {
    constructor() {
      super();
      this.message = 'Folder not found';
    }
  }

  class FolderInItselfError extends Error {
    constructor() {
      super();
      this.message = "You can't put this folder in itself.";
    }
  }

  class LocalStorageUnavailableError extends Error {
    constructor() {
      super();
      this.message = 'LocalStorage unavailable';
    }
  }

  class InvalidPasswordError extends Error {
    constructor() {
      super();
      this.message = 'Invalid password';
    }
  }

  class CantEditSecretError extends Error {
    constructor() {
      super();
      this.message = "You can't edit this secret";
    }
  }

  class CantShareSecretError extends Error {
    constructor() {
      super();
      this.message = "You can't share this secret";
    }
  }

  class CantUnshareSecretError extends Error {
    constructor() {
      super();
      this.message = "You can't unshare this secret";
    }
  }

  class CantUnshareWithYourselfError extends Error {
    constructor() {
      super();
      this.message = "You can't unshare with yourself";
    }
  }

  class CantShareWithYourselfError extends Error {
    constructor() {
      super();
      this.message = "You can't share with yourself";
    }
  }

  class SecretAlreadyExistsError extends Error {
    constructor() {
      super();
      this.message = 'Wow you are unlucky ! SecretID already exists';
    }
  }

  class SecretNotFoundError extends Error {
    constructor() {
      super();
      this.message = 'Secret not found';
    }
  }

  class CantGenerateNewKeyError extends Error {
    constructor() {
      super();
      this.message = "You can't generate new key for this secret";
    }
  }

  class NotSharedWithUserError extends Error {
    constructor() {
      super();
      this.message = 'Secret not shared with this user';
    }
  }

  class FriendNotFoundError extends Error {
    constructor() {
      super();
      this.message = 'Friend not found';
    }
  }

  class OfflineError extends Error {
    constructor() {
      super();
      this.message = 'Offline';
    }
  }

  class NotAvailableError extends Error {
    constructor() {
      super();
      this.message = 'Not available in standalone mode';
    }
  }

  class WrappingError {
    constructor(error) {
      if (error.constructor !== String) {
        this.error = error;
      } else if (error === 'Unknown error') {
        this.error = new ServerUnknownError();
      } else if (error === 'User not found') {
        this.error = new UserNotFoundError();
      } else if (error === 'Username already exists') {
        this.error = new UsernameAlreadyExistsError();
      } else if (error === 'Need TOTP token') {
        this.error = new NeedTOTPTokenError();
      } else if (error === 'You are disconnected') {
        this.error = new DisconnectedError();
      } else if (error === 'Invalid signature') {
        this.error = new InvalidSignatureError();
      } else if (error === "You don't have this secret") {
        this.error = new DontHaveSecretError();
      } else if (error === 'Folder not found') {
        this.error = new FolderNotFoundError();
      } else if (error === "You can't put this folder in itself.") {
        this.error = new FolderInItselfError();
      } else if (error === 'LocalStorage unavailable') {
        this.error = new LocalStorageUnavailableError();
      } else if (error === 'Invalid Password') {
        this.error = new InvalidPasswordError();
      } else if (error === "You can't edit this secret") {
        this.error = new CantEditSecretError();
      } else if (error === "You can't share this secret") {
        this.error = new CantShareSecretError();
      } else if (error === "You can't unshare this secret") {
        this.error = new CantUnshareSecretError();
      } else if (error === "You can't unshare with yourself") {
        this.error = new CantUnshareWithYourselfError();
      } else if (error === "You can't share with yourself") {
        this.error = new CantShareWithYourselfError();
      } else if (error === 'Secret already exists') {
        this.error = new SecretAlreadyExistsError();
      } else if (error === 'Secret not found') {
        this.error = new SecretNotFoundError();
      } else if (error === "You can't generate new key for this secret") {
        this.error = new CantGenerateNewKeyError();
      } else if (error === 'Secret not shared with this user') {
        this.error = new NotSharedWithUserError();
      } else if (error === 'Friend not found') {
        this.error = new FriendNotFoundError();
      } else if (error === 'Offline') {
        this.error = new OfflineError();
      } else if (error === 'Not available in standalone mode') {
        this.error = new NotAvailableError();
      } else if (error === 'Something goes wrong.') {
        this.error = new SomethingGoesWrong();
      } else {
        this.error = new Error(error);
      }
    }
  }

  const Errors = {
    Error,
    ServerUnknownError,
    UserNotFoundError,
    UsernameAlreadyExistsError,
    NeedTOTPTokenError,
    DisconnectedError,
    InvalidSignatureError,
    DontHaveSecretError,
    FolderNotFoundError,
    FolderInItselfError,
    LocalStorageUnavailableError,
    WrappingError,
    InvalidPasswordError,
    CantEditSecretError,
    CantShareSecretError,
    CantUnshareSecretError,
    CantUnshareWithYourselfError,
    CantShareWithYourselfError,
    SecretAlreadyExistsError,
    SecretNotFoundError,
    CantGenerateNewKeyError,
    NotSharedWithUserError,
    FriendNotFoundError,
    OfflineError,
    InvalidHexStringError,
    XorSeedError,
    NotAvailableError,
    SomethingGoesWrong,
  };

  /* eslint-disable max-classes-per-file */
  class Status {
    constructor(state = 0, total = 1) {
      this.message = 'Unknown status';
      this.state = state;
      this.total = total;
    }
  }

  class PasswordDerivationStatus extends Status {
    constructor() {
      super();
      this.message = 'Password derivation';
    }
  }

  class GetDerivationStatus extends Status {
    constructor() {
      super();

      this.message = 'Retrieve derivation parameters';
    }
  }

  class GetUserStatus extends Status {
    constructor() {
      super();
      this.message = 'Get user encrypted datas';
    }
  }

  class GetProtectKeyStatus extends Status {
    constructor() {
      super();
      this.message = 'Get encrypted protect key';
    }
  }

  class ImportPublicKeyStatus extends Status {
    constructor() {
      super();
      this.message = 'Import public key';
    }
  }

  class DecryptPrivateKeyStatus extends Status {
    constructor() {
      super();
      this.message = 'Decrypt private key';
    }
  }

  class DecryptUserOptionsStatus extends Status {
    constructor() {
      super();
      this.message = 'Decrypt user options';
    }
  }

  class DecryptMetadataCacheStatus extends Status {
    constructor() {
      super();
      this.message = 'Decrypt metadata cache';
    }
  }

  class EndDecryptMetadataStatus extends Status {
    constructor() {
      super();
      this.message = 'End decrypt metadata';
    }
  }

  class DecryptMetadataStatus extends Status {
    constructor(state, total) {
      super(state, total);
      this.message = 'Decrypt metadata';
    }

    step() {
      this.state += 1;
    }
  }

  class ImportSecretStatus extends Status {
    constructor(state, total) {
      super(state, total);
      this.message = 'Import secret';
    }

    step() {
      this.state += 1;
    }
  }

  const Statuses = {
    Status,
    GetDerivationStatus,
    PasswordDerivationStatus,
    GetUserStatus,
    ImportPublicKeyStatus,
    DecryptPrivateKeyStatus,
    DecryptUserOptionsStatus,
    DecryptMetadataCacheStatus,
    DecryptMetadataStatus,
    EndDecryptMetadataStatus,
    GetProtectKeyStatus,
    ImportSecretStatus,
  };

  const symbols = '!@#$%^&*()+_=}{[]|:;"?.><,`~';
  const vowels = 'aeiouy';
  const consonants = 'bcdfghjklmnpqrstvwxz';
  const numbers = '0123456789';

  const similarChars = '[ilLI|`oO0';

  function generateRandomNumber(max) {
    const randomValues = new Uint8Array(1);
    crypto.getRandomValues(randomValues);
    return randomValues[0] % max;
  }

  function escapeRegExp(s) {
    return s.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&');
  }

  const hasNumber = (str) => str.match(/\d+/g) != null;
  const hasMixedCase = (str) =>
    str.toUpperCase() !== str && str.toLowerCase() !== str;
  const hasSymbol = (str) => {
    const regexString = `[${escapeRegExp(symbols)}]`;
    const symbolRegex = new RegExp(regexString);
    return str.match(symbolRegex) != null;
  };

  const checkStrictRules = (str, rules) =>
    rules.numbers === hasNumber(str) &&
    rules.mixedCase === hasMixedCase(str) &&
    rules.symbols === hasSymbol(str);

  const buildCharset = (options) => {
    const charset = [];

    const letters = vowels + consonants;

    charset.push(...[...letters]);

    if (options.contentRules.mixedCase) {
      charset.push(...[...letters.toUpperCase()]);
    }
    if (options.contentRules.numbers) {
      charset.push(...[...numbers]);
    }
    if (options.contentRules.symbols) {
      charset.push(...[...symbols]);
    }

    if (options.contentRules.similarChars === false) {
      charset.filter((character) => similarChars.indexOf(character) >= 0);
    }

    return charset;
  };

  const getRandomPassword = (options) => {
    let password = '';

    if (options.readable) {
      let lastCharWasVocal = false; // TODO : rand

      for (let i = 0; i < options.length; i += 1) {
        const charset = lastCharWasVocal ? consonants : vowels;
        lastCharWasVocal = !lastCharWasVocal;
        const randomIndex = generateRandomNumber(charset.length);
        password += charset[randomIndex];
      }
    } else {
      const charset = buildCharset(options);

      for (let i = 0; i < options.length; i += 1) {
        const randomIndex = generateRandomNumber(charset.length);
        password += charset[randomIndex];
      }
    }

    return password;
  };

  const generatePassword = (customOptions) => {
    const defaults = {
      length: 20,
      readable: false,
      allowSimilarChars: false,
      strictRules: true,
      contentRules: {
        numbers: true,
        mixedCase: true,
        symbols: true,
      },
    };

    const options = { ...defaults, ...customOptions };
    const { contentRules } = options;

    const password = getRandomPassword(options);

    if (options.strictRules) {
      return checkStrictRules(password, contentRules)
        ? password
        : generatePassword(customOptions);
    }

    return password;
  };

  const PasswordGenerator = {
    hasNumber,
    hasMixedCase,
    hasSymbol,
    checkStrictRules,
    buildCharset,
    getRandomPassword,
    generatePassword,
    generateRandomNumber,
    escapeRegExp,
  };

  /* eslint-disable no-bitwise */

  function hexStringToUint8Array(hexString) {
    if (hexString.length % 2 !== 0) {
      throw new InvalidHexStringError();
    }
    const arrayBuffer = new Uint8Array(hexString.length / 2);

    for (let i = 0; i < hexString.length; i += 2) {
      const byteValue = parseInt(hexString.substr(i, 2), 16);
      if (Number.isNaN(byteValue)) {
        throw new InvalidHexStringError();
      }
      arrayBuffer[i / 2] = byteValue;
    }

    return arrayBuffer;
  }

  function bytesToHexString(givenBytes) {
    if (!givenBytes) {
      return null;
    }

    const bytes = new Uint8Array(givenBytes);
    const hexBytes = [];

    for (let i = 0; i < bytes.length; i += 1) {
      let byteString = bytes[i].toString(16);
      if (byteString.length < 2) {
        byteString = `0${byteString}`;
      }
      hexBytes.push(byteString);
    }
    return hexBytes.join('');
  }

  function asciiToUint8Array(str) {
    const chars = [];
    for (let i = 0; i < str.length; i += 1) {
      chars.push(str.charCodeAt(i));
    }
    return new Uint8Array(chars);
  }

  function asciiToHexString(str) {
    return str
      .split('')
      .map((c) => `0${c.charCodeAt(0).toString(16)}`.slice(-2))
      .join('');
  }

  function hexStringToAscii(hexx) {
    const hex = hexx.toString();
    let str = '';
    for (let i = 0; i < hex.length; i += 2) {
      str += String.fromCharCode(parseInt(hex.substr(i, 2), 16));
    }
    return str;
  }

  function bytesToASCIIString(bytes) {
    // String.fromCharCode.apply(null, new Uint8Array(bytes)) trigger Maximum call stack size exceeded
    const array = new Uint8Array(bytes);
    return array.reduce(
      (str, charIndex) => str + String.fromCharCode(charIndex),
      ''
    );
  }

  function generateSeed() {
    const buf = new Uint8Array(32);
    crypto.getRandomValues(buf);

    let shift = 3;
    let carry = 0;
    let symbol;
    let byte;
    let i;
    let output = '';
    const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';

    for (i = 0; i < buf.length; i += 1) {
      byte = buf[i];

      symbol = carry | (byte >> shift);
      output += alphabet[symbol & 0x1f];

      if (shift > 5) {
        shift -= 5;
        symbol = byte >> shift;
        output += alphabet[symbol & 0x1f];
      }

      shift = 5 - shift;
      carry = byte << shift;
      shift = 8 - shift;
    }

    if (shift !== 3) {
      output += alphabet[carry & 0x1f];
      shift = 3;
      carry = 0;
    }

    return { b32: output, raw: buf };
  }

  function localStorageAvailable() {
    try {
      const storage = window.localStorage;
      const x = '__storage_test__';
      storage.setItem(x, x);
      storage.removeItem(x);
      return true;
    } catch (e) {
      return false;
    }
  }

  function xorSeed(byteArray1, byteArray2) {
    if (
      byteArray1 instanceof Uint8Array &&
      byteArray2 instanceof Uint8Array &&
      byteArray1.length === 32 &&
      byteArray2.length === 32
    ) {
      const buf = new Uint8Array(32);
      let i;
      for (i = 0; i < 32; i += 1) {
        buf[i] = byteArray1[i] ^ byteArray2[i];
      }
      return bytesToHexString(buf);
    }
    throw new XorSeedError();
  }

  function defaultProgress(status) {
    const seconds = Math.trunc(Date.now());
    if (status.total < 2) {
      // eslint-disable-next-line no-console
      console.log(`${seconds} : ${status.message}`);
    } else {
      // eslint-disable-next-line no-console
      console.log(
        `${seconds} : ${status.message} (${status.state}/${status.total})`
      );
    }
  }

  const SecretinPrefix = 'Secret-in:';

  const Utils = {
    generateSeed,
    hexStringToUint8Array,
    bytesToHexString,
    asciiToUint8Array,
    bytesToASCIIString,
    xorSeed,
    defaultProgress,
    asciiToHexString,
    hexStringToAscii,
    PasswordGenerator,
    SecretinPrefix,
  };

  class API$1 {
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

    addUser(username, privateKey, publicKey, pass, options) {
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

  class User {
    constructor(username, cryptoAdapter) {
      this.cryptoAdapter = cryptoAdapter;
      this.username = username;
      this.publicKey = null;
      this.publicKeySign = null;
      this.privateKey = null;
      this.privateKeySign = null;
      this.keys = {};
      this.hash = '';
      this.totp = false;
      this.metadatas = {};
      this.options = User.defaultOptions;
    }

    disconnect() {
      delete this.username;
      delete this.publicKey;
      delete this.publicKeySign;
      delete this.privateKey;
      delete this.privateKeySign;
      delete this.metadatas;
      delete this.keys;
      delete this.hash;
      delete this.totp;
      delete this.options;
    }

    sign(datas) {
      return this.cryptoAdapter.sign(datas, this.privateKeySign);
    }

    verify(datas, signature) {
      return this.cryptoAdapter.verify(datas, signature, this.publicKeySign);
    }

    generateMasterKey() {
      return this.cryptoAdapter
        .genRSAOAEP()
        .then((keyPair) => {
          this.publicKey = keyPair.publicKey;
          this.privateKey = keyPair.privateKey;
          return this.cryptoAdapter.convertOAEPToPSS(this.privateKey, 'sign');
        })
        .then((privateKeySign) => {
          this.privateKeySign = privateKeySign;
          return this.cryptoAdapter.convertOAEPToPSS(this.publicKey, 'verify');
        })
        .then((publicKeySign) => {
          this.publicKeySign = publicKeySign;
        });
    }

    exportPublicKey() {
      return this.cryptoAdapter.exportClearKey(this.publicKey);
    }

    importPublicKey(jwkPublicKey) {
      return this.cryptoAdapter
        .importPublicKey(jwkPublicKey)
        .then((publicKey) => {
          this.publicKey = publicKey;
          return this.cryptoAdapter.convertOAEPToPSS(this.publicKey, 'verify');
        })
        .then((publicKeySign) => {
          this.publicKeySign = publicKeySign;
        });
    }

    exportPrivateKey(password) {
      const pass = {};
      return this.cryptoAdapter
        .derivePassword(password)
        .then((dKey) => {
          pass.salt = dKey.salt;
          this.hash = dKey.hash;
          pass.hash = this.hash;
          pass.iterations = dKey.iterations;
          return this.cryptoAdapter.exportKey(dKey.key, this.privateKey);
        })
        .then((keyObject) => ({
          privateKey: {
            privateKey: keyObject.key,
            iv: keyObject.iv,
          },
          pass,
        }));
    }

    importPrivateKey(dKey, privateKeyObject) {
      return this.cryptoAdapter
        .importPrivateKey(dKey, privateKeyObject)
        .then((privateKey) => {
          this.privateKey = privateKey;
          return this.cryptoAdapter.convertOAEPToPSS(this.privateKey, 'sign');
        })
        .then((privateKeySign) => {
          this.privateKeySign = privateKeySign;
        })
        .catch(() => Promise.reject(new InvalidPasswordError()));
    }

    exportBigPrivateData(data) {
      const result = {};
      return this.cryptoAdapter
        .encryptAESGCM256(data)
        .then((secretObject) => {
          result.secret = secretObject.secret;
          result.iv = secretObject.iv;
          return this.wrapKey(secretObject.key, this.publicKey);
        })
        .then((wrappedKey) => {
          result.wrappedKey = wrappedKey;
          return result;
        });
    }

    importBigPrivateData(data) {
      return this.unwrapKey(data.wrappedKey).then((key) =>
        this.cryptoAdapter.decryptAESGCM256(data, key)
      );
    }

    exportPrivateData(data) {
      const result = {};
      return this.cryptoAdapter
        .encryptRSAOAEP(data, this.publicKey)
        .then((encryptedOptions) => {
          result.data = encryptedOptions;
          return this.sign(result.data);
        })
        .then((signature) => {
          result.signature = signature;
          return result;
        });
    }

    importPrivateData(data, signature) {
      return this.verify(data, signature).then((verified) => {
        if (verified) {
          return this.cryptoAdapter.decryptRSAOAEP(data, this.privateKey);
        }
        return null;
      });
    }

    exportOptions() {
      return this.exportPrivateData(this.options).then((result) => ({
        options: result.data,
        signature: result.signature,
      }));
    }

    importOptions(optionsObject) {
      // Retro compatibility
      if (typeof optionsObject === 'undefined') {
        this.options = User.defaultOptions;
        return Promise.resolve(null);
      }
      return this.importPrivateData(
        optionsObject.options,
        optionsObject.signature
      ).then((options) => {
        if (options) {
          this.options = options;
        } else {
          this.options = User.defaultOptions;
        }
      });
    }

    shareSecret(friend, wrappedKey, hashedTitle) {
      const result = { hashedTitle };
      return this.unwrapKey(wrappedKey)
        .then((key) => this.wrapKey(key, friend.publicKey))
        .then((friendWrappedKey) => {
          result.wrappedKey = friendWrappedKey;
          return this.cryptoAdapter.getSHA256(friend.username);
        })
        .then((hashedUsername) => {
          result.friendName = hashedUsername;
          return result;
        });
    }

    editSecret(hashedTitle, secret, history) {
      const metadatas = this.metadatas[hashedTitle];
      if (typeof metadatas === 'undefined') {
        return Promise.reject(new DontHaveSecretError());
      }
      const now = new Date();
      metadatas.lastModifiedAt = now.toISOString();
      metadatas.lastModifiedBy = this.username;
      const wrappedKey = this.keys[hashedTitle].key;
      const result = {};
      return this.unwrapKey(wrappedKey)
        .then((key) => this.encryptSecret(metadatas, secret, history, key))
        .then((secretObject) => {
          result.secret = secretObject.secret;
          result.iv = secretObject.iv;
          result.metadatas = secretObject.metadatas;
          result.iv_meta = secretObject.iv_meta;
          result.history = secretObject.history;
          result.iv_history = secretObject.iv_history;
          return result;
        });
    }

    createSecret(metadatas, secret) {
      const now = Date.now();
      const saltedTitle = `${now}|${metadatas.title}`;
      const result = {};
      const newMetadas = metadatas;
      return this.cryptoAdapter
        .getSHA256(saltedTitle)
        .then((hashedTitle) => {
          result.hashedTitle = hashedTitle;
          newMetadas.id = result.hashedTitle;
          return this.encryptSecret(newMetadas, secret);
        })
        .then((secretObject) => {
          result.secret = secretObject.secret;
          result.iv = secretObject.iv;
          result.metadatas = secretObject.metadatas;
          result.iv_meta = secretObject.iv_meta;
          result.history = secretObject.history;
          result.iv_history = secretObject.iv_history;
          result.hashedUsername = secretObject.hashedUsername;
          return this.wrapKey(secretObject.key, this.publicKey);
        })
        .then((wrappedKey) => {
          result.wrappedKey = wrappedKey;
          return result;
        });
    }

    exportSecret(
      hashedTitle,
      encryptedSecret,
      encryptedMetadata,
      encryptedHistory
    ) {
      let secret;
      let metadata;
      return this.decryptSecret(hashedTitle, encryptedSecret)
        .then((rSecret) => {
          secret = rSecret;
          return this.decryptSecret(hashedTitle, encryptedMetadata);
        })
        .then((rMetadata) => {
          metadata = { ...rMetadata, title: decodeURIComponent(rMetadata.title) };
          if (typeof encryptedHistory.iv === 'undefined') {
            return Promise.resolve({});
          }
          return this.decryptSecret(hashedTitle, encryptedHistory);
        })
        .then((history) => ({
          secret,
          metadata,
          history,
        }));
    }

    importSecret(hashedTitle, secret, metadata, history) {
      const result = {};
      return this.encryptSecret(metadata, secret, history)
        .then((secretObject) => {
          result.secret = secretObject.secret;
          result.iv = secretObject.iv;
          result.metadatas = secretObject.metadatas;
          result.iv_meta = secretObject.iv_meta;
          result.history = secretObject.history;
          result.iv_history = secretObject.iv_history;
          result.hashedUsername = secretObject.hashedUsername;
          result.hashedTitle = hashedTitle;
          return this.wrapKey(secretObject.key, this.publicKey);
        })
        .then((wrappedKey) => {
          result.wrappedKey = wrappedKey;
          return result;
        });
    }

    encryptSecret(metadatas, secret, history, key) {
      const result = {};
      let newHistory;
      return Promise.resolve()
        .then(() => {
          if (Array.isArray(history)) {
            // history already decrypted
            return Promise.resolve(history);
          }
          if (
            typeof history !== 'undefined' &&
            typeof history.iv !== 'undefined' &&
            typeof history.secret !== 'undefined'
          ) {
            // history must be decrypted
            return this.decryptSecret(metadatas.id, history);
          }
          // no history yet
          return Promise.resolve([]);
        })
        .then((rHistory) => {
          newHistory = rHistory;
          if (
            newHistory.length === 0 ||
            JSON.stringify(newHistory[0].secret) !== JSON.stringify(secret)
          ) {
            newHistory.unshift({
              secret,
              lastModifiedAt: metadatas.lastModifiedAt,
              lastModifiedBy: metadatas.lastModifiedBy,
            });
          }
          return this.cryptoAdapter.encryptAESGCM256(secret, key);
        })
        .then((secretObject) => {
          result.secret = secretObject.secret;
          result.iv = secretObject.iv;
          result.key = secretObject.key;
          return this.cryptoAdapter.encryptAESGCM256(
            { ...metadatas, title: encodeURIComponent(metadatas.title) },
            secretObject.key
          );
        })
        .then((secretObject) => {
          result.metadatas = secretObject.secret;
          result.iv_meta = secretObject.iv;
          return this.cryptoAdapter.encryptAESGCM256(
            newHistory,
            secretObject.key
          );
        })
        .then((secretObject) => {
          result.history = secretObject.secret;
          result.iv_history = secretObject.iv;
          return this.cryptoAdapter.getSHA256(this.username);
        })
        .then((hashedUsername) => {
          result.hashedUsername = hashedUsername;
          return result;
        });
    }

    decryptSecret(hashedTitle, secret) {
      if (typeof this.keys[hashedTitle] === 'undefined') {
        return Promise.reject(new DontHaveSecretError());
      }
      const wrappedKey = this.keys[hashedTitle].key;
      return this.unwrapKey(wrappedKey).then((key) =>
        this.cryptoAdapter.decryptAESGCM256(secret, key)
      );
    }

    unwrapKey(wrappedKey) {
      return this.cryptoAdapter.unwrapRSAOAEP(wrappedKey, this.privateKey);
    }

    wrapKey(key, publicKey) {
      return this.cryptoAdapter.wrapRSAOAEP(key, publicKey);
    }

    decryptAllMetadatas(allMetadatas, progress = defaultProgress) {
      const hashedTitles = Object.keys(this.keys);

      const progressStatus = new DecryptMetadataStatus(0, hashedTitles.length);
      progress(progressStatus);
      const metadatas = {};
      return hashedTitles
        .reduce(
          (promise, hashedTitle) =>
            promise.then(() =>
              this.decryptSecret(hashedTitle, allMetadatas[hashedTitle]).then(
                (metadata) => {
                  progressStatus.step();
                  progress(progressStatus);
                  metadatas[hashedTitle] = {
                    ...metadata,
                    title: decodeURIComponent(metadata.title),
                  };
                }
              )
            ),
          Promise.resolve()
        )
        .then(() => metadatas);
    }

    activateShortLogin(shortpass, deviceName) {
      let protectKey;
      const toSend = {};
      return this.cryptoAdapter
        .generateWrappingKey()
        .then((key) => {
          protectKey = key;
          return this.cryptoAdapter.exportKey(protectKey, this.privateKey);
        })
        .then((object) => {
          localStorage.setItem(`${SecretinPrefix}privateKey`, object.key);
          localStorage.setItem(`${SecretinPrefix}privateKeyIv`, object.iv);
          return this.cryptoAdapter.derivePassword(shortpass);
        })
        .then((derived) => {
          toSend.salt = derived.salt;
          toSend.iterations = derived.iterations;
          toSend.hash = derived.hash;
          return this.cryptoAdapter.exportKey(derived.key, protectKey);
        })
        .then((keyObject) => {
          toSend.protectKey = keyObject.key;
          localStorage.setItem(`${SecretinPrefix}iv`, keyObject.iv);
          localStorage.setItem(`${SecretinPrefix}username`, this.username);
          return this.cryptoAdapter.getSHA256(deviceName);
        })
        .then((deviceId) => {
          toSend.deviceId = deviceId;
          localStorage.setItem(`${SecretinPrefix}deviceName`, deviceName);
          localStorage.setItem(
            `${SecretinPrefix}activatedAt`,
            new Date().toISOString()
          );
          return toSend;
        });
    }

    shortLogin(shortpass, wrappedProtectKey) {
      const keyObject = {
        key: wrappedProtectKey,
        iv: localStorage.getItem(`${SecretinPrefix}iv`),
      };
      return this.cryptoAdapter
        .importKey(shortpass, keyObject)
        .then((protectKey) => {
          const privateKeyObject = {
            privateKey: localStorage.getItem(`${SecretinPrefix}privateKey`),
            iv: localStorage.getItem(`${SecretinPrefix}privateKeyIv`),
          };
          return this.importPrivateKey(protectKey, privateKeyObject);
        })
        .catch(() => Promise.reject(new InvalidPasswordError()));
    }
  }

  Object.defineProperty(User, 'defaultOptions', {
    value: {
      timeToClose: 30,
    },
    writable: false,
    enumerable: true,
    configurable: false,
  });

  class Secretin {
    constructor(cryptoAdapter, API = API$1, db = undefined) {
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
        this.api = new API$1(DbCache, this.cryptoAdapter.getSHA256);
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
            if (err instanceof OfflineError) {
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
          if (err instanceof OfflineError) {
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
          if (err instanceof OfflineError) {
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
          if (err instanceof OfflineError) {
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
          if (err instanceof OfflineError) {
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
          if (err instanceof OfflineError) {
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
          if (err instanceof OfflineError) {
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
          if (err instanceof OfflineError) {
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
          if (err instanceof OfflineError) {
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
      hashedFolder = undefined
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
            if (err instanceof OfflineError) {
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
          if (err instanceof OfflineError) {
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
          () => Promise.reject(new FriendNotFoundError())
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
          if (err instanceof OfflineError) {
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
          if (err instanceof OfflineError) {
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
          if (err instanceof OfflineError) {
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
          if (err instanceof OfflineError) {
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
          if (err instanceof OfflineError) {
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
          if (err instanceof OfflineError) {
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
          if (err instanceof OfflineError) {
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
          if (err instanceof OfflineError) {
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
          if (err instanceof OfflineError) {
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
          if (err instanceof OfflineError) {
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
          if (err instanceof OfflineError) {
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
          if (err instanceof OfflineError) {
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
            if (err instanceof OfflineError) {
              this.offlineDB();
            }
            const wrapper = new WrappingError(err);
            throw wrapper.error;
          });
      }
      return Promise.reject(new LocalStorageUnavailableError());
    }

    // eslint-disable-next-line class-methods-use-this
    getShortLoginActivationDate() {
      if (localStorageAvailable()) {
        const dateStr = localStorage.getItem(`${SecretinPrefix}activatedAt`);
        return dateStr ? new Date(dateStr) : null;
      }
      throw new LocalStorageUnavailableError();
    }

    // eslint-disable-next-line class-methods-use-this
    deactivateShortLogin() {
      if (localStorageAvailable()) {
        localStorage.removeItem(`${SecretinPrefix}username`);
        localStorage.removeItem(`${SecretinPrefix}deviceName`);
        localStorage.removeItem(`${SecretinPrefix}privateKey`);
        localStorage.removeItem(`${SecretinPrefix}privateKeyIv`);
        localStorage.removeItem(`${SecretinPrefix}iv`);
        localStorage.removeItem(`${SecretinPrefix}shortpass`);
        localStorage.removeItem(`${SecretinPrefix}shortpassSignature`);
        localStorage.removeItem(`${SecretinPrefix}activatedAt`);
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
          if (err instanceof OfflineError) {
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
        if (err instanceof OfflineError) {
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
          if (err instanceof OfflineError) {
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
            API$1,
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
      const oldSecretin = new Secretin(this.cryptoAdapter, API$1, oldDB);
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

  function reqData(path, datas, type, timeout = 10000) {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      if (typeof window.process !== 'undefined') {
        // Electron
        xhr.timeout = timeout;
      }
      // eslint-disable-next-line security/detect-non-literal-fs-filename
      xhr.open(type, encodeURI(path));
      xhr.setRequestHeader('Content-Type', 'application/json');
      xhr.onload = () => {
        const newData = JSON.parse(xhr.responseText);
        if (xhr.status === 200) {
          resolve(newData.reason ? newData.reason : newData);
        } else {
          reject(newData.reason);
        }
      };
      xhr.ontimeout = () => {
        reject(new OfflineError());
      };
      xhr.onerror = () => {
        reject(new OfflineError());
      };
      xhr.send(JSON.stringify(datas));
    });
  }

  function doGET(path, timeout = 6000) {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      if (typeof window.process !== 'undefined') {
        // Electron
        xhr.timeout = timeout;
      }
      xhr.open('GET', encodeURI(path));
      xhr.onload = () => {
        const datas = JSON.parse(xhr.responseText);
        if (xhr.status === 200) {
          resolve(datas);
        } else {
          reject(datas.reason);
        }
      };
      xhr.ontimeout = () => {
        reject(new OfflineError());
      };
      xhr.onerror = () => {
        reject(new OfflineError());
      };
      xhr.send();
    });
  }

  function doPOST(path, datas, timeout = 10000) {
    return reqData(path, datas, 'POST', timeout);
  }

  function doPUT(path, datas, timeout = 10000) {
    return reqData(path, datas, 'PUT', timeout);
  }

  function doDELETE(path, datas, timeout = 10000) {
    return reqData(path, datas, 'DELETE', timeout);
  }

  class API {
    constructor(link, getSHA256) {
      if (link) {
        this.db = link;
      } else {
        this.db = window.location.origin;
      }
      this.getSHA256 = getSHA256;
    }

    userExists(username, isHashed) {
      return this.retrieveUser(username, 'undefined', isHashed).then(
        () => true,
        () => false
      );
    }

    addUser(username, privateKey, publicKey, pass, options) {
      return this.getSHA256(username).then((hashedUsername) =>
        doPOST(`${this.db}/user/${hashedUsername}`, {
          pass,
          privateKey,
          publicKey,
          keys: {},
          options,
        })
      );
    }

    addSecret(user, secretObject) {
      const json = JSON.stringify({
        secret: secretObject.secret,
        iv: secretObject.iv,
        metadatas: secretObject.metadatas,
        iv_meta: secretObject.iv_meta,
        history: secretObject.history,
        iv_history: secretObject.iv_history,
        key: secretObject.wrappedKey,
        title: secretObject.hashedTitle,
      });
      const now = Date.now();
      return user.sign(`${json}|${now}`).then((signature) =>
        doPOST(`${this.db}/secret/${secretObject.hashedUsername}`, {
          json,
          sig: signature,
          sigTime: now,
        })
      );
    }

    deleteSecret(user, hashedTitle) {
      let url;
      const now = Date.now();
      return this.getSHA256(user.username)
        .then((hashedUsername) => {
          url = `/secret/${hashedUsername}/${hashedTitle}`;
          return user.sign(`DELETE ${url}|${now}`);
        })
        .then((signature) =>
          doDELETE(`${this.db}${url}`, {
            sig: signature,
            sigTime: now,
          })
        );
    }

    editSecret(user, secretObject, hashedTitle) {
      let hashedUsername;
      const json = JSON.stringify({
        iv: secretObject.iv,
        secret: secretObject.secret,
        iv_meta: secretObject.iv_meta,
        metadatas: secretObject.metadatas,
        iv_history: secretObject.iv_history,
        history: secretObject.history,
        title: hashedTitle,
      });
      const now = Date.now();
      return this.getSHA256(user.username)
        .then((rHashedUsername) => {
          hashedUsername = rHashedUsername;
          return user.sign(`${json}|${now}`);
        })
        .then((signature) =>
          doPUT(`${this.db}/secret/${hashedUsername}`, {
            json,
            sig: signature,
            sigTime: now,
          })
        );
    }

    newKey(user, hashedTitle, secret, wrappedKeys) {
      let hashedUsername;
      const json = JSON.stringify({
        wrappedKeys,
        secret,
        title: hashedTitle,
      });
      const now = Date.now();
      return this.getSHA256(user.username)
        .then((rHashedUsername) => {
          hashedUsername = rHashedUsername;
          return user.sign(`${json}|${now}`);
        })
        .then((signature) =>
          doPOST(`${this.db}/newKey/${hashedUsername}`, {
            json,
            sig: signature,
            sigTime: now,
          })
        );
    }

    unshareSecret(user, friendNames, hashedTitle) {
      let hashedUsername;
      const hashedFriendUsernames = [];
      const datas = {
        title: hashedTitle,
      };
      let json;
      const now = Date.now();
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
          datas.friendNames = hashedFriendUsernames;
          json = JSON.stringify(datas);
          return user.sign(`${json}|${now}`);
        })
        .then((signature) =>
          doPOST(`${this.db}/unshare/${hashedUsername}`, {
            json,
            sig: signature,
            sigTime: now,
          })
        );
    }

    shareSecret(user, sharedSecretObjects) {
      let hashedUsername;
      const json = JSON.stringify({
        secretObjects: sharedSecretObjects,
      });
      const now = Date.now();
      return this.getSHA256(user.username)
        .then((rHashedUsername) => {
          hashedUsername = rHashedUsername;
          return user.sign(`${json}|${now}`);
        })
        .then((signature) =>
          doPOST(`${this.db}/share/${hashedUsername}`, {
            json,
            sig: signature,
            sigTime: now,
          })
        );
    }

    retrieveUser(username, hash, hashed) {
      let isHashed = Promise.resolve();
      let hashedUsername = username;
      if (!hashed) {
        isHashed = isHashed
          .then(() => this.getSHA256(username))
          .then((rHashedUsername) => {
            hashedUsername = rHashedUsername;
          });
      }
      return isHashed.then(() =>
        doGET(`${this.db}/user/${hashedUsername}/${hash}`)
      );
    }

    getDerivationParameters(username, isHashed) {
      return this.retrieveUser(username, 'undefined', isHashed).then((user) => ({
        totp: user.pass.totp,
        shortpass: user.pass.shortpass,
        salt: user.pass.salt,
        iterations: user.pass.iterations,
      }));
    }

    getPublicKey(username, isHashed) {
      return this.retrieveUser(username, 'undefined', isHashed).then(
        (user) => user.publicKey
      );
    }

    getUser(username, hash, otp) {
      return this.getSHA256(username).then((hashedUsername) =>
        doGET(`${this.db}/user/${hashedUsername}/${hash}?otp=${otp}`)
      );
    }

    getUserWithSignature(user) {
      let url;
      const now = Date.now();
      return this.getSHA256(user.username)
        .then((hashedUsername) => {
          url = `/user/${hashedUsername}`;
          return user.sign(`${url}|${now}`);
        })
        .then((signature) =>
          doGET(`${this.db}${url}?sig=${signature}&sigTime=${now}`, 0)
        );
    }

    getSecret(hashedTitle, user) {
      let url;
      const now = Date.now();
      return this.getSHA256(user.username)
        .then((hashedUsername) => {
          url = `/secret/${hashedUsername}/${hashedTitle}`;
          return user.sign(`${url}|${now}`);
        })
        .then((signature) =>
          doGET(`${this.db}${url}?sig=${signature}&sigTime=${now}`)
        );
    }

    getHistory(user, hashedTitle) {
      let url;
      const now = Date.now();
      return this.getSHA256(user.username)
        .then((hashedUsername) => {
          url = `/history/${hashedUsername}/${hashedTitle}`;
          return user.sign(`${url}|${now}`);
        })
        .then((signature) =>
          doGET(`${this.db}${url}?sig=${signature}&sigTime=${now}`)
        )
        .then((secret) => ({
          iv: secret.iv_history,
          secret: secret.history,
        }));
    }

    getProtectKey(username, deviceName, hash) {
      let hashedUsername;
      return this.getSHA256(username)
        .then((rHashedUsername) => {
          hashedUsername = rHashedUsername;
          return this.getSHA256(deviceName);
        })
        .then((deviceId) =>
          doGET(`${this.db}/protectKey/${hashedUsername}/${deviceId}/${hash}`)
        )
        .then((result) => {
          // eslint-disable-next-line security/detect-possible-timing-attacks
          if (hash === 'undefined') {
            return result;
          }
          return result.protectKey;
        });
    }

    getProtectKeyParameters(username, deviceName) {
      return this.getProtectKey(username, deviceName, 'undefined');
    }

    getDb(user, revs) {
      let url;
      const json = JSON.stringify(revs);
      const now = Date.now();
      return this.getSHA256(user.username)
        .then((hashedUsername) => {
          url = `/database/${hashedUsername}`;
          return user.sign(`${json}|${now}`);
        })
        .then((signature) =>
          doPOST(`${this.db}${url}`, {
            json,
            sig: signature,
            sigTime: now,
          })
        );
    }

    getRescueCodes(user) {
      let url;
      const now = Date.now();
      return this.getSHA256(user.username)
        .then((hashedUsername) => {
          url = `/rescueCodes/${hashedUsername}`;
          return user.sign(`${url}|${now}`);
        })
        .then((signature) =>
          doGET(`${this.db}${url}?sig=${signature}&sigTime=${now}`)
        );
    }

    editUser(user, datas) {
      let hashedUsername;
      const json = JSON.stringify(datas);
      const now = Date.now();
      return this.getSHA256(user.username)
        .then((rHashedUsername) => {
          hashedUsername = rHashedUsername;
          return user.sign(`${json}|${now}`);
        })
        .then((signature) =>
          doPUT(`${this.db}/user/${hashedUsername}`, {
            json,
            sig: signature,
            sigTime: now,
          })
        );
    }

    changePassword(user, privateKey, pass) {
      let hashedUsername;
      const json = JSON.stringify({
        pass,
        privateKey,
      });
      const now = Date.now();
      return this.getSHA256(user.username)
        .then((rHashedUsername) => {
          hashedUsername = rHashedUsername;
          return user.sign(`${json}|${now}`);
        })
        .then((signature) =>
          doPUT(`${this.db}/user/${hashedUsername}`, {
            json,
            sig: signature,
            sigTime: now,
          })
        );
    }

    testTotp(seed, token) {
      return doGET(`${this.db}/totp/${seed}/${token}`);
    }

    activateTotp(seed, user) {
      let hashedUsername;
      const json = JSON.stringify({
        seed,
      });
      const now = Date.now();
      return this.getSHA256(user.username)
        .then((rHashedUsername) => {
          hashedUsername = rHashedUsername;
          return user.sign(`${json}|${now}`);
        })
        .then((signature) =>
          doPUT(`${this.db}/activateTotp/${hashedUsername}`, {
            json,
            sig: signature,
            sigTime: now,
          })
        );
    }

    deactivateTotp(user) {
      let url;
      const now = Date.now();
      return this.getSHA256(user.username)
        .then((hashedUsername) => {
          url = `/deactivateTotp/${hashedUsername}`;
          return user.sign(`${url}|${now}`);
        })
        .then((signature) =>
          doPUT(`${this.db}${url}?sig=${signature}&sigTime=${now}`, {})
        );
    }

    activateShortLogin(shortpass, user) {
      let hashedUsername;
      const json = JSON.stringify({
        shortpass,
      });
      const now = Date.now();
      return this.getSHA256(user.username)
        .then((rHashedUsername) => {
          hashedUsername = rHashedUsername;
          return user.sign(`${json}|${now}`);
        })
        .then((signature) =>
          doPUT(`${this.db}/activateShortLogin/${hashedUsername}`, {
            json,
            sig: signature,
            sigTime: now,
          })
        );
    }

    isOnline() {
      return doGET(`${this.db}/ping`);
    }
  }

  Secretin.version = version;
  Secretin.User = User;
  Secretin.API = {
    Standalone: API$1,
    Server: API,
  };

  Secretin.Errors = Errors;
  Secretin.Statuses = Statuses;
  Secretin.Utils = Utils;

  return Secretin;

})();
