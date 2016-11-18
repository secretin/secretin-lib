let availableKeyCounter = 0;
crypto.subtle.oldGenerateKey = crypto.subtle.generateKey;
crypto.subtle.generateKey = function (algorithm, extractable, keyUsages) {
  if (algorithm.name === 'RSA-OAEP') {
    const key = mockedKeys[availableKeyCounter];
    const keyObject = {};
    availableKeyCounter += 1;

    const format = 'jwk';
    const nAlgorithm = {
      name: 'RSA-OAEP',
      hash: { name: 'SHA-256' },
    };
    const nExtractable = true;
    const pubKeyUsages = [
      'wrapKey',
      'encrypt',
    ];
    const pKeyUsages = [
      'unwrapKey',
      'decrypt',
    ];
    return crypto.subtle.importKey(format, key.publicKey, nAlgorithm, nExtractable, pubKeyUsages)
    .then((publicKey) => {
      keyObject.publicKey = publicKey;
      return crypto.subtle.importKey(format, key.privateKey, nAlgorithm, nExtractable, pKeyUsages);
    })
    .then((privateKey) => {
      keyObject.privateKey = privateKey;
      return keyObject;
    });
  }
  return crypto.subtle.oldGenerateKey(algorithm, extractable, keyUsages)
  .then((test) => {
    return test;
  });
};
