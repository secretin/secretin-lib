var API = function(link) {
  var _this = this;
  if(link){
    _this.db = link;
  }
  else{
    var http = location.protocol;
    var port = location.port;
    var slashes = http.concat("//");
    _this.db = slashes.concat(window.location.hostname+':'+port);
  }
};

API.prototype.userExists = function(username){
  var _this = this;
  return _this.retrieveUser(username, false).then(function(user){
    return true;
  }).catch(function(err){
    return false;
  });
};

API.prototype.addUser = function(username, privateKey, publicKey){
  var _this = this;
  return SHA256(username).then(function(hashedUsername){
    return POST(_this.db+'/user/'+bytesToHexString(hashedUsername),{
      privateKey: privateKey,
      publicKey: publicKey,
      keys: {}
    });
  });
};

API.prototype.addSecret = function(secretObject){
  var _this = this;
  return POST(_this.db+'/user/'+secretObject.hashedUsername+'/'+secretObject.hashedTitle,{
    secret: secretObject.secret,
    iv: secretObject.iv,
    title: secretObject.encryptedTitle,
    key: secretObject.wrappedKey
  });
};

API.prototype.deleteSecret = function(user, hashedTitle){
  var _this = this;
  var hashdeUsername;
  return SHA256(user.username).then(function(rHashedUsername){
    hashedUsername = bytesToHexString(rHashedUsername);
    return user.getToken(_this);
  }).then(function(token){
    return DELETE(_this.db+'/user/'+hashedUsername+'/'+hashedTitle, {
      token: bytesToHexString(token)
    });
  });
};


API.prototype.getNewChallenge = function(user){
  var _this = this;
  return SHA256(user.username).then(function(hashedUsername){
    return GET(_this.db+'/challenge/'+bytesToHexString(hashedUsername));
  });
};

API.prototype.editSecret = function(user, secretObject, hashedTitle){
  var _this = this;
  var hashdeUsername;
  return SHA256(user.username).then(function(rHashedUsername){
    hashedUsername = bytesToHexString(rHashedUsername);
    return user.getToken(_this);
  }).then(function(token){
    return POST(_this.db+'/edit/'+hashedUsername+'/'+hashedTitle,{
      iv: secretObject.iv,
      secret: secretObject.secret,
      token: bytesToHexString(token)
    });
  });
};

API.prototype.newKey = function(user, hashedTitle, secret, wrappedKeys){
  var _this = this;
  var hashedUsername;
  return SHA256(user.username).then(function(rHashedUsername){
    hashedUsername = bytesToHexString(rHashedUsername);
    return user.getToken(_this);
  }).then(function(token){
    return POST(_this.db+'/newKey/'+hashedUsername+'/'+hashedTitle,{
      wrappedKeys: wrappedKeys,
      secret: secret,
      token: bytesToHexString(token)
    });
  });
};

API.prototype.unshareSecret = function(user, friendName, hashedTitle, hashedFriendUsername){
  var _this = this;
  var hashedUsername;
  return SHA256(user.username).then(function(rHashedUsername){
    hashedUsername = bytesToHexString(rHashedUsername);
    return SHA256(friendName);
  }).then(function(rHashedFriendUsername){
    if(typeof(hashedFriendUsername) === 'undefined'){
      hashedFriendUsername = bytesToHexString(rHashedFriendUsername);
    }
    return user.getToken(_this);
  }).then(function(token){
    return POST(_this.db+'/unshare/'+hashedUsername+'/'+hashedTitle,{
      friendName: hashedFriendUsername,
      token: bytesToHexString(token)
    });
  });
};

API.prototype.shareSecret = function(user, sharedSecretObject, hashedTitle, rights){
  var _this = this;
  var hashedUsername;
  return SHA256(user.username).then(function(rHashedUsername){
    hashedUsername = bytesToHexString(rHashedUsername);
    return user.getToken(_this);
  }).then(function(token){
    return POST(_this.db+'/share/'+hashedUsername+'/'+hashedTitle,{
      friendName: sharedSecretObject.friendName,
      title: sharedSecretObject.encryptedTitle,
      key: sharedSecretObject.wrappedKey,
      rights: rights,
      token: bytesToHexString(token)
    });
  });
};

API.prototype.retrieveUser = function(username, hashed){
  var _this = this;
  if(hashed){
    return GET(_this.db+'/user/'+username);
  }
  else{
    return SHA256(username).then(function(hashedUsername){
      return GET(_this.db+'/user/'+bytesToHexString(hashedUsername));
    });
  }
};

API.prototype.getWrappedPrivateKey = function(username, hashed){
  var _this = this;
  return _this.retrieveUser(username, hashed).then(function(user){
    return user.privateKey;
  });
};

API.prototype.getPublicKey = function(username, hashed){
  var _this = this;
  return _this.retrieveUser(username, hashed).then(function(user){
    return user.publicKey;
  });
};

API.prototype.getKeys = function(username, hashed){
  var _this = this;
  return _this.retrieveUser(username, hashed).then(function(user){
    return user.keys;
  });
};

API.prototype.getUser = function(username){
  var _this = this;
  return _this.retrieveUser(username, false).then(function(user){
    return user;
  });
};

API.prototype.getSecret = function(hashedTitle){
  var _this = this;
  return GET(_this.db+'/secret/'+hashedTitle);
};

API.prototype.getDb = function(username){
  var _this = this;
  return SHA256(username).then(function(hashedUsername){
    return GET(_this.db+'/database/'+bytesToHexString(hashedUsername));
  });
};

API.prototype.changePassword = function(user, privateKey){
  var _this = this;
  var hashedUsername;
  return SHA256(user.username).then(function(rHashedUsername){
    hashedUsername = bytesToHexString(rHashedUsername);
    return user.getToken(_this);
  }).then(function(token){
    return PUT(_this.db+'/user/'+hashedUsername,{
      privateKey: privateKey,
      token: bytesToHexString(token)
    });
  });
};