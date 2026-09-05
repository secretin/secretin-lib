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

    it('round-trips unicode content with AESGCM', async () => {
      const unicodeSecret = { text: 'abc•def Acme™ Тест x🐢y😀z café' };
      const publicKey = await SecretinAdapter.importPublicKey(
        fixtures.publicKey
      );
      const encrypted = await SecretinAdapter.encryptAESGCM256(unicodeSecret);
      const wrappedKey = await SecretinAdapter.wrapRSAOAEP(
        encrypted.key,
        publicKey
      );

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
      const unwrappedKey = await SecretinAdapter.unwrapRSAOAEP(
        wrappedKey,
        privateKey
      );
      const decrypted = await SecretinAdapter.decryptAESGCM256(
        encrypted,
        unwrappedKey
      );
      decrypted.should.deep.equal(unicodeSecret);
    });

    it('round-trips unicode content with RSA', async () => {
      const unicodeSecret = { text: 'abc•def Acme™ Тест x🐢y😀z café' };
      const publicKey = await SecretinAdapter.importPublicKey(
        fixtures.publicKey
      );
      const encrypted = await SecretinAdapter.encryptRSAOAEP(
        unicodeSecret,
        publicKey
      );

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
        encrypted,
        privateKey
      );
      decrypted.should.deep.equal(unicodeSecret);
    });
  });
}

if (typeof module !== 'undefined') {
  module.exports = testInput;
}
