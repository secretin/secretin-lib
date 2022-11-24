let availableKeyCounter = 0;
crypto.subtle.oldGenerateKey = crypto.subtle.generateKey;
crypto.subtle.generateKey = function generateKey(
  algorithm,
  extractable,
  keyUsages
) {
  if (['RSA-OAEP', 'RSA-PSS'].includes(algorithm.name)) {
    // eslint-disable-next-line
    const key = mockedKeys[availableKeyCounter];
    if (algorithm.name === 'RSA-PSS') {
      key.publicKey.alg = 'PS256';
      key.privateKey.alg = 'PS256';
      key.publicKey.key_ops = ['verify'];
      key.privateKey.key_ops = ['sign'];
    }

    const keyObject = {};
    availableKeyCounter += 1;

    const format = 'jwk';
    const nAlgorithm = {
      name: algorithm.name,
      hash: { name: 'SHA-256' },
    };
    const nExtractable = true;
    const pubKeyUsages =
      algorithm.name === 'RSA-PSS' ? ['verify'] : ['wrapKey', 'encrypt'];
    const pKeyUsages =
      algorithm.name === 'RSA-PSS' ? ['sign'] : ['unwrapKey', 'decrypt'];
    return crypto.subtle
      .importKey(format, key.publicKey, nAlgorithm, nExtractable, pubKeyUsages)
      .then((publicKey) => {
        keyObject.publicKey = publicKey;
        return crypto.subtle.importKey(
          format,
          key.privateKey,
          nAlgorithm,
          nExtractable,
          pKeyUsages
        );
      })
      .then((privateKey) => {
        keyObject.privateKey = privateKey;
        return keyObject;
      });
  }
  return crypto.subtle
    .oldGenerateKey(algorithm, extractable, keyUsages)
    .then((test) => test);
};

// eslint-disable-next-line no-underscore-dangle
crypto.__getRandomValues = crypto.getRandomValues;
crypto.getRandomValues = function getRandomValues(typedArray) {
  typedArray.fill(1337);
};
