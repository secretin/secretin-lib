import { getSHA256 } from '../lib/crypto';

import { doGET, doPOST, doPUT, doDELETE } from '../lib/http';

class API {
  constructor(link) {
    if (link) {
      this.db = link;
    } else {
      this.db = window.location.origin;
    }
  }

  userExists(username, isHashed) {
    return this.retrieveUser(username, 'undefined', isHashed).then(
      () => true,
      () => false
    );
  }

  addUser(username, privateKey, publicKey, pass, options) {
    return getSHA256(username).then(hashedUsername =>
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
    return user.sign(`${json}|${now}`).then(signature =>
      doPOST(`${this.db}/secret/${secretObject.hashedUsername}`, {
        json,
        sig: signature,
        sigTime: now,
      }));
  }

  deleteSecret(user, hashedTitle) {
    let url;
    const now = Date.now();
    return getSHA256(user.username)
      .then(hashedUsername => {
        url = `/secret/${hashedUsername}/${hashedTitle}`;
        return user.sign(`DELETE ${url}|${now}`);
      })
      .then(signature =>
        doDELETE(`${this.db}${url}`, {
          sig: signature,
          sigTime: now,
        }));
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
    return getSHA256(user.username)
      .then(rHashedUsername => {
        hashedUsername = rHashedUsername;
        return user.sign(`${json}|${now}`);
      })
      .then(signature =>
        doPUT(`${this.db}/secret/${hashedUsername}`, {
          json,
          sig: signature,
          sigTime: now,
        }));
  }

  newKey(user, hashedTitle, secret, wrappedKeys) {
    let hashedUsername;
    const json = JSON.stringify({
      wrappedKeys,
      secret,
      title: hashedTitle,
    });
    const now = Date.now();
    return getSHA256(user.username)
      .then(rHashedUsername => {
        hashedUsername = rHashedUsername;
        return user.sign(`${json}|${now}`);
      })
      .then(signature =>
        doPOST(`${this.db}/newKey/${hashedUsername}`, {
          json,
          sig: signature,
          sigTime: now,
        }));
  }

  unshareSecret(user, friendNames, hashedTitle) {
    let hashedUsername;
    const hashedFriendUsernames = [];
    const datas = {
      title: hashedTitle,
    };
    let json;
    const now = Date.now();
    return getSHA256(user.username)
      .then(rHashedUsername => {
        hashedUsername = rHashedUsername;
        const hashedFriendUseramePromises = [];
        friendNames.forEach(username => {
          hashedFriendUseramePromises.push(getSHA256(username));
        });
        return Promise.all(hashedFriendUseramePromises);
      })
      .then(rHashedFriendUserames => {
        rHashedFriendUserames.forEach(hashedFriendUserame => {
          hashedFriendUsernames.push(hashedFriendUserame);
        });
        datas.friendNames = hashedFriendUsernames;
        json = JSON.stringify(datas);
        return user.sign(`${json}|${now}`);
      })
      .then(signature =>
        doPOST(`${this.db}/unshare/${hashedUsername}`, {
          json,
          sig: signature,
          sigTime: now,
        }));
  }

  shareSecret(user, sharedSecretObjects) {
    let hashedUsername;
    const json = JSON.stringify({
      secretObjects: sharedSecretObjects,
    });
    const now = Date.now();
    return getSHA256(user.username)
      .then(rHashedUsername => {
        hashedUsername = rHashedUsername;
        return user.sign(`${json}|${now}`);
      })
      .then(signature =>
        doPOST(`${this.db}/share/${hashedUsername}`, {
          json,
          sig: signature,
          sigTime: now,
        }));
  }

  retrieveUser(username, hash, hashed) {
    let isHashed = Promise.resolve();
    let hashedUsername = username;
    if (!hashed) {
      isHashed = isHashed
        .then(() => getSHA256(username))
        .then(rHashedUsername => {
          hashedUsername = rHashedUsername;
        });
    }
    return isHashed.then(() =>
      doGET(`${this.db}/user/${hashedUsername}/${hash}`)
    );
  }

  getDerivationParameters(username, isHashed) {
    return this.retrieveUser(username, 'undefined', isHashed).then(user => ({
      totp: user.pass.totp,
      shortpass: user.pass.shortpass,
      salt: user.pass.salt,
      iterations: user.pass.iterations,
    }));
  }

  getPublicKey(username, isHashed) {
    return this.retrieveUser(username, 'undefined', isHashed).then(
      user => user.publicKey
    );
  }

  getUser(username, hash, otp) {
    return getSHA256(username).then(hashedUsername =>
      doGET(`${this.db}/user/${hashedUsername}/${hash}?otp=${otp}`)
    );
  }

  getUserWithSignature(user) {
    let url;
    const now = Date.now();
    return getSHA256(user.username)
      .then(hashedUsername => {
        url = `/user/${hashedUsername}`;
        return user.sign(`${url}|${now}`);
      })
      .then(signature =>
        doGET(`${this.db}${url}?sig=${signature}&sigTime=${now}`));
  }

  getSecret(hashedTitle, user) {
    let url;
    const now = Date.now();
    return getSHA256(user.username)
      .then(hashedUsername => {
        url = `/secret/${hashedUsername}/${hashedTitle}`;
        return user.sign(`${url}|${now}`);
      })
      .then(signature =>
        doGET(`${this.db}${url}?sig=${signature}&sigTime=${now}`));
  }

  getHistory(user, hashedTitle) {
    let url;
    const now = Date.now();
    return getSHA256(user.username)
      .then(hashedUsername => {
        url = `/history/${hashedUsername}/${hashedTitle}`;
        return user.sign(`${url}|${now}`);
      })
      .then(signature =>
        doGET(`${this.db}${url}?sig=${signature}&sigTime=${now}`))
      .then(secret => ({
        iv: secret.iv_history,
        secret: secret.history,
      }));
  }

  getProtectKey(username, deviceName, hash) {
    let hashedUsername;
    return getSHA256(username)
      .then(rHashedUsername => {
        hashedUsername = rHashedUsername;
        return getSHA256(deviceName);
      })
      .then(deviceId =>
        doGET(`${this.db}/protectKey/${hashedUsername}/${deviceId}/${hash}`)
      )
      .then(result => {
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
    return getSHA256(user.username)
      .then(hashedUsername => {
        url = `/database/${hashedUsername}`;
        return user.sign(`${json}|${now}`);
      })
      .then(signature =>
        doPOST(`${this.db}${url}`, {
          json,
          sig: signature,
          sigTime: now,
        }));
  }

  getRescueCodes(user) {
    let url;
    const now = Date.now();
    return getSHA256(user.username)
      .then(hashedUsername => {
        url = `/rescueCodes/${hashedUsername}`;
        return user.sign(`${url}|${now}`);
      })
      .then(signature =>
        doGET(`${this.db}${url}?sig=${signature}&sigTime=${now}`));
  }

  editUser(user, datas) {
    let hashedUsername;
    const json = JSON.stringify(datas);
    const now = Date.now();
    return getSHA256(user.username)
      .then(rHashedUsername => {
        hashedUsername = rHashedUsername;
        return user.sign(`${json}|${now}`);
      })
      .then(signature =>
        doPUT(`${this.db}/user/${hashedUsername}`, {
          json,
          sig: signature,
          sigTime: now,
        }));
  }

  changePassword(user, privateKey, pass) {
    let hashedUsername;
    const json = JSON.stringify({
      pass,
      privateKey,
    });
    const now = Date.now();
    return getSHA256(user.username)
      .then(rHashedUsername => {
        hashedUsername = rHashedUsername;
        return user.sign(`${json}|${now}`);
      })
      .then(signature =>
        doPUT(`${this.db}/user/${hashedUsername}`, {
          json,
          sig: signature,
          sigTime: now,
        }));
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
    return getSHA256(user.username)
      .then(rHashedUsername => {
        hashedUsername = rHashedUsername;
        return user.sign(`${json}|${now}`);
      })
      .then(signature =>
        doPUT(`${this.db}/activateTotp/${hashedUsername}`, {
          json,
          sig: signature,
          sigTime: now,
        }));
  }

  deactivateTotp(user) {
    let url;
    const now = Date.now();
    return getSHA256(user.username)
      .then(hashedUsername => {
        url = `/deactivateTotp/${hashedUsername}`;
        return user.sign(`${url}|${now}`);
      })
      .then(signature =>
        doPUT(`${this.db}${url}?sig=${signature}&sigTime=now`, {}));
  }

  activateShortLogin(shortpass, user) {
    let hashedUsername;
    const json = JSON.stringify({
      shortpass,
    });
    const now = Date.now();
    return getSHA256(user.username)
      .then(rHashedUsername => {
        hashedUsername = rHashedUsername;
        return user.sign(`${json}|${now}`);
      })
      .then(signature =>
        doPUT(`${this.db}/activateShortLogin/${hashedUsername}`, {
          json,
          sig: signature,
          sigTime: now,
        }));
  }

  isOnline() {
    return doGET(`${this.db}/ping`);
  }
}

export default API;
