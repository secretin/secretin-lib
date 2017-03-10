function genOutput(adapterName, SecretinAdapter) {
  const password = 'password';
  const secret = 'secret';
  let publicKey;
  const privateKey = {};
  let keyPair;
  const parameters = {};
  const AESGCMsecretObject = {};
  let AESGCMsecretKey;
  let RSASecret;
  let wrappedKey;
  let signature;
  let derivedKey;
  let protectKey;

  return SecretinAdapter.genRSAOAEP()
    .then((rKeyPair) => {
      keyPair = rKeyPair;
      return SecretinAdapter.exportClearKey(keyPair.publicKey);
    })
    .then((rPublicKey) => {
      publicKey = rPublicKey;
      return SecretinAdapter.derivePassword(password);
    })
    .then((dKey) => {
      parameters.salt = dKey.salt;
      parameters.iterations = dKey.iterations;
      derivedKey = dKey.key;
      return SecretinAdapter.generateWrappingKey();
    })
    .then((rProtectKey) => {
      protectKey = rProtectKey;
      return SecretinAdapter.exportKey(protectKey, keyPair.privateKey);
    })
    .then((rPrivateKey) => {
      privateKey.privateKey = rPrivateKey.key;
      privateKey.iv = rPrivateKey.iv;
      return SecretinAdapter.encryptAESGCM256(secret);
    })
    .then((secretObject) => {
      AESGCMsecretObject.iv = secretObject.iv;
      AESGCMsecretObject.secret = secretObject.secret;
      AESGCMsecretKey = secretObject.key;
      return SecretinAdapter.encryptRSAOAEP(secret, keyPair.publicKey);
    })
    .then((rRSASecret) => {
      RSASecret = rRSASecret;
      return SecretinAdapter.wrapRSAOAEP(AESGCMsecretKey, keyPair.publicKey);
    })
    .then((rWrappedKey) => {
      wrappedKey = rWrappedKey;
      return SecretinAdapter.convertOAEPToPSS(keyPair.privateKey, 'sign');
    })
    .then((privateKeySign) =>
      SecretinAdapter.sign(secret, privateKeySign)
    )
    .then((rSignature) => {
      signature = rSignature;
      return SecretinAdapter.exportKey(derivedKey, protectKey);
    })
    .then((exportedProtectKey) => {
      const output = `/* eslint-disable */
        const ${adapterName}_fixtures = {
          secret: ${JSON.stringify(secret)},
          password: ${JSON.stringify(password)},
          publicKey: ${JSON.stringify(publicKey)},
          privateKey: ${JSON.stringify(privateKey)},
          parameters: ${JSON.stringify(parameters)},
          AESGCMsecretObject: ${JSON.stringify(AESGCMsecretObject)},
          RSASecret: ${JSON.stringify(RSASecret)},
          wrappedKey: ${JSON.stringify(wrappedKey)},
          signature: ${JSON.stringify(signature)},
          protectKey: ${JSON.stringify(exportedProtectKey)},
        };
        if (typeof module !== 'undefined') {
          module.exports = ${adapterName}_fixtures;
        }
      `;
      return output;
    });
}

if (typeof module !== 'undefined') {
  module.exports = genOutput;
}
