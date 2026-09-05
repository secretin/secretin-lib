describe('Corrupted metadata cache', () => {
  const username = 'user';
  const password = 'passwOrd123!';
  const secretTitle = 'Titre • 🐢';
  const secretContent = { fields: [{ label: 'a', content: 'b' }] };

  // eslint-disable-next-line
  beforeEach(async () => {
    localStorage.clear();
    // eslint-disable-next-line
    availableKeyCounter = 0;
    // eslint-disable-next-line
    await resetAndGetDB();
    await this.secretin.newUser(username, password);
  });

  const getUserRecord = () => {
    const { db } = this.secretin.api;
    return db.users[Object.keys(db.users)[0]];
  };

  // Encrypts raw bytes the way exportBigPrivateData does, so the cache
  // decrypts fine but holds an invalid JSON document.
  const encryptCacheBytes = async (bytes) => {
    const key = await crypto.subtle.generateKey(
      { name: 'AES-GCM', length: 256 },
      true,
      ['encrypt']
    );
    const iv = new Uint8Array(12);
    crypto.getRandomValues(iv);
    const encrypted = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv, tagLength: 128 },
      key,
      bytes
    );
    const wrappedKey = await this.secretin.currentUser.wrapKey(
      key,
      this.secretin.currentUser.publicKey
    );
    return {
      secret: Secretin.Utils.bytesToHexString(encrypted),
      iv: Secretin.Utils.bytesToHexString(iv),
      wrappedKey,
    };
  };

  const loginAndCheck = async (hashedTitle) => {
    await this.secretin.currentUser.disconnect();
    await this.secretin.loginUser(username, password, '', () => null);
    this.secretin.currentUser.metadatas[hashedTitle].title.should.equal(
      secretTitle
    );
    const secret = await this.secretin.getSecret(hashedTitle);
    secret.should.deep.equal(secretContent);
  };

  it('logs in when the cache is valid ciphertext but invalid JSON', async () => {
    const hashedTitle = await this.secretin.addSecret(
      secretTitle,
      secretContent
    );
    const user = getUserRecord();
    // What the legacy encoder produced for a title containing '•'
    user.metadataCache = await encryptCacheBytes(
      Secretin.Utils.asciiToUint8Array('{"title":"Titre "}')
    );
    const corruptedSecret = user.metadataCache.secret;

    await loginAndCheck(hashedTitle);

    // The cache has been rebuilt and is now usable on its own
    getUserRecord().metadataCache.secret.should.not.equal(corruptedSecret);
    await this.secretin.currentUser.disconnect();
    await this.secretin.loginUser(username, password, '', () => null, false);
    this.secretin.currentUser.metadatas[hashedTitle].title.should.equal(
      secretTitle
    );
  });

  it('logs in when the cache cannot be decrypted at all', async () => {
    const hashedTitle = await this.secretin.addSecret(
      secretTitle,
      secretContent
    );
    const user = getUserRecord();
    user.metadataCache = {
      ...user.metadataCache,
      secret: 'deadbeef'.repeat(8),
    };

    await loginAndCheck(hashedTitle);
  });
});
