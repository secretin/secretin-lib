function testInput(adapterName, SecretinAdapter, fixtureName, fixtures) {
  describe(`${adapterName} adapter with ${fixtureName} fixtures`, () => {
    it('can decrypt secret with RSA', () =>
      SecretinAdapter.derivePassword(fixtures.password, fixtures.parameters)
        .then((dKey) =>
          SecretinAdapter.importKey(dKey.key, fixtures.protectKey)
        )
        .then((protectKey) =>
          SecretinAdapter.importPrivateKey(protectKey, fixtures.privateKey)
        )
        .then((privateKey) =>
          SecretinAdapter.decryptRSAOAEP(fixtures.RSASecret, privateKey)
        )
        .should.eventually.equal(fixtures.secret)
    );

    it('can decrypt secret with AESGCM', () =>
      SecretinAdapter.derivePassword(fixtures.password, fixtures.parameters)
        .then((dKey) =>
          SecretinAdapter.importKey(dKey.key, fixtures.protectKey)
        )
        .then((protectKey) =>
          SecretinAdapter.importPrivateKey(protectKey, fixtures.privateKey)
        )
        .then((privateKey) =>
          SecretinAdapter.unwrapRSAOAEP(fixtures.wrappedKey, privateKey)
        )
        .then((wrappedKey) =>
          SecretinAdapter.decryptAESGCM256(fixtures.AESGCMsecretObject, wrappedKey)
        )
        .should.eventually.equal(fixtures.secret)
    );

    it('can verify signature', () =>
      SecretinAdapter.importPublicKey(fixtures.publicKey)
        .then((publicKey) =>
          SecretinAdapter.convertOAEPToPSS(publicKey, 'verify')
        )
        .then((publicKeyVerify) =>
          SecretinAdapter.verify(fixtures.secret, fixtures.signature, publicKeyVerify)
        )
        .should.eventually.is.true
    );
  });
}

if (typeof module !== 'undefined') {
  module.exports = testInput;
}
