import { doGET, doPOST, doPUT, doDELETE } from '../lib/http';

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
    return this.getSHA256(username).then(hashedUsername =>
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
    return user.sign(json).then(signature =>
      doPOST(`${this.db}/secret/${secretObject.hashedUsername}`, {
        json,
        sig: signature,
      })
    );
  }

  deleteSecret(user, hashedTitle) {
    let url;
    return this.getSHA256(user.username)
      .then(hashedUsername => {
        url = `/secret/${hashedUsername}/${hashedTitle}`;
        return user.sign(`DELETE ${url}`);
      })
      .then(signature =>
        doDELETE(`${this.db}${url}`, {
          sig: signature,
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
    return this.getSHA256(user.username)
      .then(rHashedUsername => {
        hashedUsername = rHashedUsername;
        return user.sign(json);
      })
      .then(signature =>
        doPUT(`${this.db}/secret/${hashedUsername}`, {
          json,
          sig: signature,
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
    return this.getSHA256(user.username)
      .then(rHashedUsername => {
        hashedUsername = rHashedUsername;
        return user.sign(json);
      })
      .then(signature =>
        doPOST(`${this.db}/newKey/${hashedUsername}`, {
          json,
          sig: signature,
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
    return this.getSHA256(user.username)
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
        return user.sign(json);
      })
      .then(signature =>
        doPOST(`${this.db}/unshare/${hashedUsername}`, {
          json,
          sig: signature,
        })
      );
  }

  shareSecret(user, sharedSecretObjects) {
    let hashedUsername;
    const json = JSON.stringify({
      secretObjects: sharedSecretObjects,
    });
    return this.getSHA256(user.username)
      .then(rHashedUsername => {
        hashedUsername = rHashedUsername;
        return user.sign(json);
      })
      .then(signature =>
        doPOST(`${this.db}/share/${hashedUsername}`, {
          json,
          sig: signature,
        })
      );
  }

  retrieveUser(username, hash, hashed) {
    let isHashed = Promise.resolve();
    let hashedUsername = username;
    if (!hashed) {
      isHashed = isHashed
        .then(() => this.getSHA256(username))
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
    return this.getSHA256(username).then(hashedUsername =>
      doGET(`${this.db}/user/${hashedUsername}/${hash}?otp=${otp}`)
    );
  }

  getUserWithSignature(user) {
    let url;
    return this.getSHA256(user.username)
      .then(hashedUsername => {
        url = `/user/${hashedUsername}`;
        return user.sign(url);
      })
      .then(signature => doGET(`${this.db}${url}?sig=${signature}`));
  }

  getSecret(hashedTitle, user) {
    let url;
    return this.getSHA256(user.username)
      .then(hashedUsername => {
        url = `/secret/${hashedUsername}/${hashedTitle}`;
        return user.sign(url);
      })
      .then(signature => doGET(`${this.db}${url}?sig=${signature}`));
  }

  getHistory(user, hashedTitle) {
    let url;
    return getSHA256(user.username)
      .then(hashedUsername => {
        url = `/history/${hashedUsername}/${hashedTitle}`;
        return user.sign(url);
      })
      .then(signature => doGET(`${this.db}${url}?sig=${signature}`))
      .then(secret => ({
        iv: secret.iv_history,
        secret: secret.history,
      }));
  }

  getProtectKey(username, deviceName, hash) {
    let hashedUsername;
    return this.getSHA256(username)
      .then(rHashedUsername => {
        hashedUsername = rHashedUsername;
        return this.getSHA256(deviceName);
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
    return this.getSHA256(user.username)
      .then(hashedUsername => {
        url = `/database/${hashedUsername}`;
        return user.sign(json);
      })
      .then(signature =>
        doPOST(`${this.db}${url}`, {
          json,
          sig: signature,
        })
      );
  }

  getRescueCodes(user) {
    let url;
    return this.getSHA256(user.username)
      .then(hashedUsername => {
        url = `/rescueCodes/${hashedUsername}`;
        return user.sign(url);
      })
      .then(signature => doGET(`${this.db}${url}?sig=${signature}`));
  }

  editUser(user, datas, type) {
    let hashedUsername;
    const json = JSON.stringify(datas);
    return this.getSHA256(user.username)
      .then(rHashedUsername => {
        hashedUsername = rHashedUsername;
        return user.sign(json);
      })
      .then(signature =>
        doPUT(`${this.db}/user/${hashedUsername}?type=${type}`, {
          json,
          sig: signature,
        })
      );
  }

  changePassword(user, privateKey, pass) {
    let hashedUsername;
    const json = JSON.stringify({
      pass,
      privateKey,
    });
    return this.getSHA256(user.username)
      .then(rHashedUsername => {
        hashedUsername = rHashedUsername;
        return user.sign(json);
      })
      .then(signature =>
        doPUT(`${this.db}/user/${hashedUsername}`, {
          json,
          sig: signature,
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
    return this.getSHA256(user.username)
      .then(rHashedUsername => {
        hashedUsername = rHashedUsername;
        return user.sign(json);
      })
      .then(signature =>
        doPUT(`${this.db}/activateTotp/${hashedUsername}`, {
          json,
          sig: signature,
        })
      );
  }

  deactivateTotp(user) {
    let url;
    return this.getSHA256(user.username)
      .then(hashedUsername => {
        url = `/deactivateTotp/${hashedUsername}`;
        return user.sign(url);
      })
      .then(signature => doPUT(`${this.db}${url}?sig=${signature}`, {}));
  }

  activateShortLogin(shortpass, user) {
    let hashedUsername;
    const json = JSON.stringify({
      shortpass,
    });
    return this.getSHA256(user.username)
      .then(rHashedUsername => {
        hashedUsername = rHashedUsername;
        return user.sign(json);
      })
      .then(signature =>
        doPUT(`${this.db}/activateShortLogin/${hashedUsername}`, {
          json,
          sig: signature,
        })
      );
  }

  isOnline() {
    return doGET(`${this.db}/ping`);
  }
}

export default API;
