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
} from '../lib/utils';


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

  addUser(username, privateKey, publicKey, pass, options) {
    return getSHA256(username)
      .then((hashedUsername) =>
        doPOST(`${this.db}/user/${bytesToHexString(hashedUsername)}`, {
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
      key: secretObject.wrappedKey,
      title: secretObject.hashedTitle,
    });
    return user.sign(json)
      .then((signature) =>
        doPOST(`${this.db}/secret/${secretObject.hashedUsername}`, {
          json,
          sig: bytesToHexString(signature),
        }));
  }

  deleteSecret(user, hashedTitle) {
    let hashedUsername;
    let url;
    return getSHA256(user.username)
      .then((rHashedUsername) => {
        hashedUsername = bytesToHexString(rHashedUsername);
        url = `/secret/${hashedUsername}/${hashedTitle}`;
        return user.sign(`DELETE ${url}`);
      }).then((signature) =>
        doDELETE(`${this.db}${url}`, {
          sig: bytesToHexString(signature),
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
      title: hashedTitle,
    });
    return getSHA256(user.username)
      .then((rHashedUsername) => {
        hashedUsername = bytesToHexString(rHashedUsername);
        return user.sign(json);
      })
      .then((signature) =>
        doPUT(`${this.db}/secret/${hashedUsername}`, {
          json,
          sig: bytesToHexString(signature),
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
    return getSHA256(user.username)
      .then((rHashedUsername) => {
        hashedUsername = bytesToHexString(rHashedUsername);
        return user.sign(json);
      })
      .then((signature) =>
        doPOST(`${this.db}/newKey/${hashedUsername}`, {
          json,
          sig: bytesToHexString(signature),
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
        datas.friendNames = hashedFriendUsernames;
        json = JSON.stringify(datas);
        return user.sign(json);
      }).then((signature) =>
        doPOST(`${this.db}/unshare/${hashedUsername}`, {
          json,
          sig: bytesToHexString(signature),
        })
      );
  }

  shareSecret(user, sharedSecretObjects) {
    let hashedUsername;
    const json = JSON.stringify({
      secretObjects: sharedSecretObjects,
    });
    return getSHA256(user.username)
      .then((rHashedUsername) => {
        hashedUsername = bytesToHexString(rHashedUsername);
        return user.sign(json);
      }).then((signature) =>
        doPOST(`${this.db}/share/${hashedUsername}`, {
          json,
          sig: bytesToHexString(signature),
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

  getUserWithSignature(user) {
    let hashedUsername;
    let url;
    return getSHA256(user.username)
      .then((rHashedUsername) => {
        hashedUsername = bytesToHexString(rHashedUsername);
        url = `/user/${hashedUsername}`;
        return user.sign(url);
      }).then((signature) =>
        doGET(`${this.db}${url}?sig=${bytesToHexString(signature)}`));
  }

  getSecret(hashedTitle, user) {
    let hashedUsername;
    let url;
    return getSHA256(user.username)
      .then((rHashedUsername) => {
        hashedUsername = bytesToHexString(rHashedUsername);
        url = `/secret/${hashedUsername}/${hashedTitle}`;
        return user.sign(url);
      }).then((signature) =>
        doGET(`${this.db}${url}?sig=${bytesToHexString(signature)}`));
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
    let url;
    return getSHA256(user.username)
      .then((rHashedUsername) => {
        hashedUsername = bytesToHexString(rHashedUsername);
        url = `/database/${hashedUsername}`;
        return user.sign(url);
      })
      .then((signature) =>
        doGET(`${this.db}${url}?sig=${bytesToHexString(signature)}`));
  }

  editUser(user, datas, type) {
    let hashedUsername;
    const json = JSON.stringify(datas);
    return getSHA256(user.username)
      .then((rHashedUsername) => {
        hashedUsername = bytesToHexString(rHashedUsername);
        return user.sign(json);
      }).then((signature) =>
        doPUT(`${this.db}/user/${hashedUsername}?type=${type}`, {
          json,
          sig: bytesToHexString(signature),
        })
      );
  }

  changePassword(user, privateKey, pass) {
    let hashedUsername;
    const json = JSON.stringify({
      pass,
      privateKey,
    });
    return getSHA256(user.username)
      .then((rHashedUsername) => {
        hashedUsername = bytesToHexString(rHashedUsername);
        return user.sign(json);
      }).then((signature) =>
        doPUT(`${this.db}/user/${hashedUsername}`, {
          json,
          sig: bytesToHexString(signature),
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
    return getSHA256(user.username)
      .then((rHashedUsername) => {
        hashedUsername = bytesToHexString(rHashedUsername);
        return user.sign(json);
      }).then((signature) =>
        doPUT(`${this.db}/activateTotp/${hashedUsername}`, {
          json,
          sig: bytesToHexString(signature),
        })
      );
  }

  activateShortpass(shortpass, user) {
    let hashedUsername;
    const json = JSON.stringify({
      shortpass,
    });
    return getSHA256(user.username)
      .then((rHashedUsername) => {
        hashedUsername = bytesToHexString(rHashedUsername);
        return user.sign(json);
      }).then((signature) =>
        doPUT(`${this.db}/activateShortpass/${hashedUsername}`, {
          json,
          sig: bytesToHexString(signature),
        }));
  }
}

export default API;
