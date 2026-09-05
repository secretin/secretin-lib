describe('Unicode secret content', () => {
  const username = 'user';
  const password = 'passwOrd123!';

  // Characters whose code point ends in 0x22 used to be truncated to '"'
  // (Uint8Array keeps the low byte only), which broke JSON.parse on decrypt.
  const unicodeContent = {
    fields: [
      { label: 'bullet', content: 'abc•def' },
      { label: 'trademark', content: 'Acme™' },
      { label: 'cyrillic', content: 'Тест' },
      { label: 'emoji', content: 'x🐢y😀z' },
      { label: 'latin1', content: 'café' },
      { label: 'backslash', content: 'aŜb' },
    ],
  };
  const unicodeTitle = 'Titre • 🐢 Тест';

  // eslint-disable-next-line
  beforeEach(async () => {
    localStorage.clear();
    // eslint-disable-next-line
    availableKeyCounter = 0;
  });

  it('round-trips through AES-GCM', async () => {
    const keyPair = await SecretinBrowserAdapter.genRSAOAEP();
    const encrypted = await SecretinBrowserAdapter.encryptAESGCM256(
      unicodeContent
    );
    const wrappedKey = await SecretinBrowserAdapter.wrapRSAOAEP(
      encrypted.key,
      keyPair.publicKey
    );
    const key = await SecretinBrowserAdapter.unwrapRSAOAEP(
      wrappedKey,
      keyPair.privateKey
    );
    const decrypted = await SecretinBrowserAdapter.decryptAESGCM256(
      encrypted,
      key
    );
    decrypted.should.deep.equal(unicodeContent);
  });

  it('round-trips through RSA-OAEP', async () => {
    const keyPair = await SecretinBrowserAdapter.genRSAOAEP();
    const encrypted = await SecretinBrowserAdapter.encryptRSAOAEP(
      unicodeContent,
      keyPair.publicKey
    );
    const decrypted = await SecretinBrowserAdapter.decryptRSAOAEP(
      encrypted,
      keyPair.privateKey
    );
    decrypted.should.deep.equal(unicodeContent);
  });

  it('still decrypts secrets encrypted with the legacy encoding', async () => {
    const legacyContent = { fields: [{ label: 'latin1', content: 'café' }] };
    const key = await crypto.subtle.generateKey(
      { name: 'AES-GCM', length: 256 },
      true,
      ['encrypt', 'decrypt']
    );
    const iv = new Uint8Array(12);
    crypto.getRandomValues(iv);
    const legacyBytes = Secretin.Utils.asciiToUint8Array(
      JSON.stringify(legacyContent)
    );
    const encrypted = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv, tagLength: 128 },
      key,
      legacyBytes
    );
    const secretObject = {
      iv: Secretin.Utils.bytesToHexString(iv),
      secret: Secretin.Utils.bytesToHexString(encrypted),
    };
    const decrypted = await SecretinBrowserAdapter.decryptAESGCM256(
      secretObject,
      key
    );
    decrypted.should.deep.equal(legacyContent);
  });

  it('stores and reads back a secret with unicode content', async () => {
    // eslint-disable-next-line
    await resetAndGetDB();
    await this.secretin.newUser(username, password);
    const hashedTitle = await this.secretin.addSecret(
      unicodeTitle,
      unicodeContent
    );
    await this.secretin.currentUser.disconnect();
    await this.secretin.loginUser(username, password, '', () => null);

    this.secretin.currentUser.metadatas[hashedTitle].title.should.equal(
      unicodeTitle
    );
    const secret = await this.secretin.getSecret(hashedTitle);
    secret.should.deep.equal(unicodeContent);
  });
});
