function testInput(adapterName, SecretinAdapter, fixtureName, fixtures) {
  describe(`${adapterName} adapter with ${fixtureName} fixtures`, () => {
    it('can decrypt secret with RSA', async () => {
      const { key } = await SecretinAdapter.derivePassword(
        fixtures.password,
        fixtures.parameters
      );

      const protectKey = await SecretinAdapter.importKey(
        key,
        fixtures.protectKey
      );

      const privateKey = await SecretinAdapter.importPrivateKey(
        protectKey,
        fixtures.privateKey
      );

      const decrypted = await SecretinAdapter.decryptRSAOAEP(
        fixtures.RSASecret,
        privateKey
      );

      decrypted.should.equal(fixtures.secret);
    });

    it('can decrypt secret with AESGCM', async () => {
      const { key } = await SecretinAdapter.derivePassword(
        fixtures.password,
        fixtures.parameters
      );

      const protectKey = await SecretinAdapter.importKey(
        key,
        fixtures.protectKey
      );

      const privateKey = await SecretinAdapter.importPrivateKey(
        protectKey,
        fixtures.privateKey
      );

      const wrappedKey = await SecretinAdapter.unwrapRSAOAEP(
        fixtures.wrappedKey,
        privateKey
      );

      const decrypted = await SecretinAdapter.decryptAESGCM256(
        fixtures.AESGCMsecretObject,
        wrappedKey
      );

      decrypted.should.equal(fixtures.secret);
    });

    it('can verify signature', async () => {
      const publicKey = await SecretinAdapter.importPublicKey(
        fixtures.publicKey
      );

      const publicKeyVerify = await SecretinAdapter.convertOAEPToPSS(
        publicKey,
        'verify'
      );

      const verified = await SecretinAdapter.verify(
        fixtures.secret,
        fixtures.signature,
        publicKeyVerify
      );
      verified.should.equal(true);
    });
  });
}

if (typeof module !== 'undefined') {
  module.exports = testInput;
}
