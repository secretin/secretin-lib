import {
  getSHA256,
} from '../lib/crypto';

import {
  doGET,
  doPOST,
  doPUT,
  doDELETE,
} from '../lib/http';

import {
  bytesToHexString,
} from '../lib/util';


class API {
  constructor(link) {
    if (link) {
      this.db = link;
    } else {
      this.db = window.location.origin;
    }
  }

  userExists(username, isHashed) {
    return this.retrieveUser(username, 'undefined', isHashed)
      .then(() => true, () => false);
  }

  addUser(username, privateKey, publicKey, pass) {
    return getSHA256(username)
      .then((hashedUsername) =>
        doPOST(`${this.db}/user/${bytesToHexString(hashedUsername)}`, {
          pass,
          privateKey,
          publicKey,
          keys: {},
        })
      );
  }

  addSecret(user, secretObject) {
    return user.getToken(this)
      .then((token) =>
        doPOST(`${this.db}/user/${secretObject.hashedUsername}/${secretObject.hashedTitle}`, {
          secret: secretObject.secret,
          iv: secretObject.iv,
          metadatas: secretObject.metadatas,
          iv_meta: secretObject.iv_meta,
          key: secretObject.wrappedKey,
          token: bytesToHexString(token),
        })
      );
  }

  deleteSecret(user, hashedTitle) {
    let hashedUsername;
    return getSHA256(user.username)
      .then((rHashedUsername) => {
        hashedUsername = bytesToHexString(rHashedUsername);
        return user.getToken(this);
      }).then((token) =>
        doDELETE(`${this.db}/user/${hashedUsername}/${hashedTitle}`, {
          token: bytesToHexString(token),
        })
      );
  }


  getNewChallenge(user) {
    return getSHA256(user.username)
      .then((hashedUsername) =>
        doGET(`${this.db}/challenge/${bytesToHexString(hashedUsername)}`));
  }

  editSecret(user, secretObject, hashedTitle) {
    let hashedUsername;
    return getSHA256(user.username)
      .then((rHashedUsername) => {
        hashedUsername = bytesToHexString(rHashedUsername);
        return user.getToken(this);
      })
      .then((token) =>
        doPOST(`${this.db}/edit/${hashedUsername}/${hashedTitle}`, {
          iv: secretObject.iv,
          secret: secretObject.secret,
          iv_meta: secretObject.iv_meta,
          metadatas: secretObject.metadatas,
          token: bytesToHexString(token),
        })
      );
  }

  newKey(user, hashedTitle, secret, wrappedKeys) {
    let hashedUsername;
    return getSHA256(user.username)
      .then((rHashedUsername) => {
        hashedUsername = bytesToHexString(rHashedUsername);
        return user.getToken(this);
      })
      .then((token) =>
        doPOST(`${this.db}/newKey/${hashedUsername}/${hashedTitle}`, {
          wrappedKeys,
          secret,
          token: bytesToHexString(token),
        })
      );
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
        return user.getToken(this);
      }).then((token) =>
        doPOST(`${this.db}/unshare/${hashedUsername}/${hashedTitle}`, {
          friendNames: hashedFriendUsernames,
          token: bytesToHexString(token),
        })
      );
  }

  shareSecret(user, sharedSecretObjects) {
    let hashedUsername;
    return getSHA256(user.username)
      .then((rHashedUsername) => {
        hashedUsername = bytesToHexString(rHashedUsername);
        return user.getToken(this);
      }).then((token) =>
        doPOST(`${this.db}/share/${hashedUsername}`, {
          secretObjects: sharedSecretObjects,
          token: bytesToHexString(token),
        })
      );
  }

  retrieveUser(username, hash, hashed) {
    let isHashed = Promise.resolve();
    let hashedUsername = username;
    if (!hashed) {
      isHashed = isHashed
        .then(() => getSHA256(username))
        .then((rHashedUsername) => {
          hashedUsername = bytesToHexString(rHashedUsername);
          return;
        });
    }
    return isHashed
      .then(() =>
        doGET(`${this.db}/user/${hashedUsername}/${hash}`)
      );
  }

  getDerivationParameters(username, isHashed) {
    return this.retrieveUser(username, 'undefined', isHashed)
      .then((user) => ({
        totp: user.pass.totp,
        shortpass: user.pass.shortpass,
        salt: user.pass.salt,
        iterations: user.pass.iterations,
      }));
  }

  getPublicKey(username, isHashed) {
    return this.retrieveUser(username, 'undefined', isHashed)
      .then((user) => user.publicKey);
  }

  getUser(username, hash, otp) {
    return getSHA256(username)
      .then((hashedUsername) =>
        doGET(`${this.db}/user/${bytesToHexString(hashedUsername)}/${hash}?otp=${otp}`));
  }

  getUserWithToken(user) {
    let hashedUsername;
    return getSHA256(user.username)
      .then((rHashedUsername) => {
        hashedUsername = bytesToHexString(rHashedUsername);
        return user.getToken(this);
      }).then((token) =>
        doGET(`${this.db}/user/${hashedUsername}?token=${bytesToHexString(token)}`));
  }

  getSecret(hashedTitle, user) {
    let hashedUsername;
    return getSHA256(user.username)
      .then((rHashedUsername) => {
        hashedUsername = bytesToHexString(rHashedUsername);
        return user.getToken(this);
      }).then((token) => {
        let uri = `${this.db}/secret/`;
        uri += `${hashedTitle}?name=${hashedUsername}&token=`;
        uri += `${bytesToHexString(token)}`;
        return doGET(uri);
      });
  }

  getProtectKey(username, deviceName, hash) {
    let hashedUsername;
    return getSHA256(username)
      .then((rHashedUsername) => {
        hashedUsername = bytesToHexString(rHashedUsername);
        return getSHA256(deviceName);
      })
      .then((deviceId) =>
        doGET(`${this.db}/protectKey/${hashedUsername}/${bytesToHexString(deviceId)}/${hash}`))
      .then((result) => {
        if (hash === 'undefined') {
          return result;
        }
        return result.protectKey;
      });
  }

  getProtectKeyParameters(username, deviceName) {
    return this.getProtectKey(username, deviceName, 'undefined');
  }

  getDb(user) {
    let hashedUsername;
    return getSHA256(user.username)
      .then((rHashedUsername) => {
        hashedUsername = bytesToHexString(rHashedUsername);
        return user.getToken(this);
      })
      .then((token) =>
        doGET(`${this.db}/database/${hashedUsername}?token=${bytesToHexString(token)}`));
  }

  changePassword(user, privateKey, pass) {
    let hashedUsername;
    return getSHA256(user.username)
      .then((rHashedUsername) => {
        hashedUsername = bytesToHexString(rHashedUsername);
        return user.getToken(this);
      }).then((token) =>
        doPUT(`${this.db}/user/${hashedUsername}`, {
          pass,
          privateKey,
          token: bytesToHexString(token),
        })
      );
  }

  testTotp(seed, token) {
    return doGET(`${this.db}/totp/${seed}/${token}`);
  }

  activateTotp(seed, user) {
    let hashedUsername;
    return getSHA256(user.username)
      .then((rHashedUsername) => {
        hashedUsername = bytesToHexString(rHashedUsername);
        return user.getToken(this);
      }).then((token) =>
        doPUT(`${this.db}/activateTotp/${hashedUsername}`, {
          seed,
          token: bytesToHexString(token),
        })
      );
  }

  activateShortpass(shortpass, user) {
    let hashedUsername;
    return getSHA256(user.username)
      .then((rHashedUsername) => {
        hashedUsername = bytesToHexString(rHashedUsername);
        return user.getToken(this);
      }).then((token) =>
        doPUT(`${this.db}/activateShortpass/${hashedUsername}`, {
          shortpass,
          token: bytesToHexString(token),
        }));
  }
}

export default API;
