describe('Secret accesses', () => {
  const now = '2016-01-01T00:00:00.000Z';
  // eslint-disable-next-line
  Date.prototype.toISOString = () => now;
  const userRead = 'user1';
  const passwordRead = 'passWord123!1';

  const userReadWrite = 'user2';
  const passwordReadWrite = 'passWord123!2';

  const userReadWriteShare = 'user3';
  const passwordReadWriteShare = 'passWord123!3';

  const userNoAccess = 'user4';
  const passwordNoAccess = 'passWord123!4';

  const secretTitle = 'secret';
  let secretId = '';
  const secretContent = {
    fields: [
      {
        label: 'a',
        content: 'b',
      },
    ],
  };
  const newSecretContent = {
    fields: [
      {
        label: 'c',
        content: 'd',
      },
    ],
  };
  let secretKeyRead = '';
  let secretKeyReadWrite = '';
  let secretKeyReadWriteShare = '';

  beforeEach(async () => {
    localStorage.clear();
    // eslint-disable-next-line
    availableKeyCounter = 0;
    // eslint-disable-next-line
    await resetAndGetDB()
    await this.secretin.newUser(userNoAccess, passwordNoAccess);
    await this.secretin.newUser(userRead, passwordRead);
    await this.secretin.newUser(userReadWrite, passwordReadWrite);

    await this.secretin.newUser(userReadWriteShare, passwordReadWriteShare);

    secretId = await this.secretin.addSecret(secretTitle, secretContent);

    secretKeyReadWriteShare = this.secretin.currentUser.keys[secretId].key;
    await this.secretin.shareSecret(secretId, userRead, 0);
    await this.secretin.shareSecret(secretId, userReadWrite, 1);

    this.secretin.currentUser.disconnect();
    await this.secretin.loginUser(userReadWrite, passwordReadWrite);

    secretKeyReadWrite = this.secretin.currentUser.keys[secretId].key;
    this.secretin.currentUser.disconnect();
    await this.secretin.loginUser(userRead, passwordRead);

    secretKeyRead = this.secretin.currentUser.keys[secretId].key;
    this.secretin.currentUser.disconnect();
  });

  describe('No access user', () => {
    it('Should not be able to read', async () => {
      await this.secretin.loginUser(userNoAccess, passwordNoAccess);
      let error;
      try {
        await this.secretin.getSecret(secretId);
      } catch (e) {
        error = e;
      }

      error.should.be.instanceOf(Secretin.Errors.DontHaveSecretError);
    });

    it('Should not be able to write', async () => {
      await this.secretin.loginUser(userNoAccess, passwordNoAccess);
      let error;
      try {
        await this.secretin.editSecret(secretId, newSecretContent);
      } catch (e) {
        error = e;
      }
      error.should.be.instanceOf(Secretin.Errors.DontHaveSecretError);
    });

    it('Should not be able to share', async () => {
      await this.secretin.loginUser(userNoAccess, passwordNoAccess);
      let error;
      try {
        await this.secretin.shareSecret(secretId, userRead, 0);
      } catch (e) {
        error = e;
      }
      error.should.be.instanceOf(Secretin.Errors.DontHaveSecretError);
    });

    it('Should not be able to unshare', async () => {
      await this.secretin.loginUser(userNoAccess, passwordNoAccess);
      let error;
      try {
        await this.secretin.unshareSecret(secretId, userRead);
      } catch (e) {
        error = e;
      }

      error.should.be.instanceOf(Secretin.Errors.DontHaveSecretError);
    });

    it('Should not be able to delete', async () => {
      await this.secretin.loginUser(userNoAccess, passwordNoAccess);
      let error;
      try {
        await this.secretin.deleteSecret(secretId);
      } catch (e) {
        error = e;
      }

      error.should.be.instanceOf(Secretin.Errors.DontHaveSecretError);
    });

    it('Should not be able to renew intermediate key', async () => {
      await this.secretin.loginUser(userNoAccess, passwordNoAccess);
      let error;
      try {
        await this.secretin.renewKey(secretId);
      } catch (e) {
        error = e;
      }
      error.should.be.instanceOf(Secretin.Errors.DontHaveSecretError);
    });
  });

  describe('Read only user', () => {
    it('Should be able to read', async () => {
      await this.secretin.loginUser(userRead, passwordRead);
      const secret = await this.secretin.getSecret(secretId);
      secret.should.deep.equal(secretContent);
      this.secretin.currentUser.metadatas[secretId].should.deep.equal({
        lastModifiedAt: now,
        lastModifiedBy: userReadWriteShare,
        users: {
          [userRead]: {
            username: userRead,
            rights: 0,
            folders: { ROOT: true },
          },
          [userReadWrite]: {
            username: userReadWrite,
            rights: 1,
            folders: { ROOT: true },
          },
          [userReadWriteShare]: {
            username: userReadWriteShare,
            rights: 2,
            folders: { ROOT: true },
          },
        },
        title: secretTitle,
        type: 'secret',
        id: secretId,
      });
    });

    it('Should not be able to write', async () => {
      await this.secretin.loginUser(userRead, passwordRead);
      let error;
      try {
        await this.secretin.editSecret(secretId, newSecretContent);
      } catch (e) {
        error = e;
      }
      error.should.be.instanceOf(Secretin.Errors.CantEditSecretError);
    });

    it('Should not be able to share', async () => {
      await this.secretin.loginUser(userRead, passwordRead);
      let error;
      try {
        await this.secretin.shareSecret(secretId, userNoAccess, 0);
      } catch (e) {
        error = e;
      }
      error.should.be.instanceOf(Secretin.Errors.CantShareSecretError);
    });

    it('Should not be able to unshare', async () => {
      await this.secretin.loginUser(userRead, passwordRead);
      let error;
      try {
        await this.secretin.unshareSecret(secretId, userReadWrite);
      } catch (e) {
        error = e;
      }
      error.should.be.instanceOf(Secretin.Errors.CantUnshareSecretError);
    });

    it('Should not be able to renew intermediate key', async () => {
      await this.secretin.loginUser(userRead, passwordRead);
      let error;
      try {
        await this.secretin.renewKey(secretId);
      } catch (e) {
        error = e;
      }

      error.should.be.instanceOf(Secretin.Errors.CantGenerateNewKeyError);
      this.secretin.currentUser.keys[secretId].key.should.be.equal(
        secretKeyRead
      );
    });
  });

  describe('Read/Write only user', () => {
    it('Should be able to read', async () => {
      await this.secretin.loginUser(userReadWrite, passwordReadWrite);
      const secret = await this.secretin.getSecret(secretId);
      secret.should.deep.equal(secretContent);
      this.secretin.currentUser.metadatas[secretId].should.deep.equal({
        lastModifiedAt: now,
        lastModifiedBy: userReadWriteShare,
        users: {
          [userRead]: {
            username: userRead,
            rights: 0,
            folders: { ROOT: true },
          },
          [userReadWrite]: {
            username: userReadWrite,
            rights: 1,
            folders: { ROOT: true },
          },
          [userReadWriteShare]: {
            username: userReadWriteShare,
            rights: 2,
            folders: { ROOT: true },
          },
        },
        title: secretTitle,
        type: 'secret',
        id: secretId,
      });
    });

    it('Should be able to write', async () => {
      await this.secretin.loginUser(userReadWrite, passwordReadWrite);
      await this.secretin.editSecret(secretId, newSecretContent);
      const secret = await this.secretin.getSecret(secretId);
      secret.should.deep.equal(newSecretContent);
      this.secretin.currentUser.metadatas[secretId].should.deep.equal({
        lastModifiedAt: now,
        lastModifiedBy: userReadWrite,
        users: {
          [userRead]: {
            username: userRead,
            rights: 0,
            folders: { ROOT: true },
          },
          [userReadWrite]: {
            username: userReadWrite,
            rights: 1,
            folders: { ROOT: true },
          },
          [userReadWriteShare]: {
            username: userReadWriteShare,
            rights: 2,
            folders: { ROOT: true },
          },
        },
        title: secretTitle,
        type: 'secret',
        id: secretId,
      });
    });

    it('Should not be able to share', async () => {
      await this.secretin.loginUser(userReadWrite, passwordReadWrite);

      let error;
      try {
        await this.secretin.shareSecret(secretId, userNoAccess, 0);
      } catch (e) {
        error = e;
      }
      error.should.be.instanceOf(Secretin.Errors.CantShareSecretError);
    });

    it('Should not be able to unshare', async () => {
      await this.secretin.loginUser(userReadWrite, passwordReadWrite);
      let error;
      try {
        await this.secretin.unshareSecret(secretId, userRead);
      } catch (e) {
        error = e;
      }
      error.should.be.instanceOf(Secretin.Errors.CantUnshareSecretError);
    });

    it('Should not be able to renew intermediate key', async () => {
      await this.secretin.loginUser(userReadWrite, passwordReadWrite);
      let error;
      try {
        await this.secretin.renewKey(secretId);
      } catch (e) {
        error = e;
      }

      error.should.be.instanceOf(Secretin.Errors.CantGenerateNewKeyError);
      this.secretin.currentUser.keys[secretId].key.should.be.equal(
        secretKeyReadWrite
      );
    });
  });

  describe('Read/Write/Share only user', () => {
    it('Should be able to read', async () => {
      await this.secretin.loginUser(userReadWriteShare, passwordReadWriteShare);
      const secret = await this.secretin.getSecret(secretId);
      secret.should.deep.equal(secretContent);
      this.secretin.currentUser.metadatas[secretId].should.deep.equal({
        lastModifiedAt: now,
        lastModifiedBy: userReadWriteShare,
        users: {
          [userRead]: {
            username: userRead,
            rights: 0,
            folders: { ROOT: true },
          },
          [userReadWrite]: {
            username: userReadWrite,
            rights: 1,
            folders: { ROOT: true },
          },
          [userReadWriteShare]: {
            username: userReadWriteShare,
            rights: 2,
            folders: { ROOT: true },
          },
        },
        title: secretTitle,
        type: 'secret',
        id: secretId,
      });
    });

    it('Should be able to write', async () => {
      await this.secretin.loginUser(userReadWriteShare, passwordReadWriteShare);
      await this.secretin.editSecret(secretId, secretContent);
      const secret = await this.secretin.getSecret(secretId);
      secret.should.deep.equal(secretContent);
      this.secretin.currentUser.metadatas[secretId].should.deep.equal({
        lastModifiedAt: now,
        lastModifiedBy: userReadWriteShare,
        users: {
          [userRead]: {
            username: userRead,
            rights: 0,
            folders: { ROOT: true },
          },
          [userReadWrite]: {
            username: userReadWrite,
            rights: 1,
            folders: { ROOT: true },
          },
          [userReadWriteShare]: {
            username: userReadWriteShare,
            rights: 2,
            folders: { ROOT: true },
          },
        },
        title: secretTitle,
        type: 'secret',
        id: secretId,
      });
    });

    it('Should be able to share', async () => {
      await this.secretin.loginUser(userReadWriteShare, passwordReadWriteShare);
      await this.secretin.shareSecret(secretId, userNoAccess, 0);

      this.secretin.currentUser.disconnect();
      await this.secretin.loginUser(userNoAccess, passwordNoAccess);

      const secret = await this.secretin.getSecret(secretId);
      secret.should.deep.equal(secretContent);
      this.secretin.currentUser.metadatas[secretId].should.deep.equal({
        lastModifiedAt: now,
        lastModifiedBy: userReadWriteShare,
        users: {
          [userRead]: {
            username: userRead,
            rights: 0,
            folders: { ROOT: true },
          },
          [userReadWrite]: {
            username: userReadWrite,
            rights: 1,
            folders: { ROOT: true },
          },
          [userReadWriteShare]: {
            username: userReadWriteShare,
            rights: 2,
            folders: { ROOT: true },
          },
          [userNoAccess]: {
            username: userNoAccess,
            rights: 0,
            folders: { ROOT: true },
          },
        },
        title: secretTitle,
        type: 'secret',
        id: secretId,
      });
    });

    it('Should be able to unshare', async () => {
      await this.secretin.loginUser(userReadWriteShare, passwordReadWriteShare);
      await this.secretin.unshareSecret(secretId, userRead);

      this.secretin.currentUser.disconnect();
      await this.secretin.loginUser(userRead, passwordRead);
      let error;
      try {
        await this.secretin.getSecret(secretId);
      } catch (e) {
        error = e;
      }
      error.should.be.instanceOf(Secretin.Errors.DontHaveSecretError);

      this.secretin.currentUser.disconnect();
      await this.secretin.loginUser(userReadWrite, passwordReadWrite);

      const secret = await this.secretin.getSecret(secretId);
      secret.should.deep.equal(secretContent);
      this.secretin.currentUser.metadatas[secretId].should.deep.equal({
        lastModifiedAt: now,
        lastModifiedBy: userReadWriteShare,
        users: {
          [userReadWrite]: {
            username: userReadWrite,
            rights: 1,
            folders: { ROOT: true },
          },
          [userReadWriteShare]: {
            username: userReadWriteShare,
            rights: 2,
            folders: { ROOT: true },
          },
        },
        title: secretTitle,
        type: 'secret',
        id: secretId,
      });
    });

    it("Should not be able to unshare with user who don't have access", async () => {
      await this.secretin.loginUser(userReadWriteShare, passwordReadWriteShare);
      let error;
      try {
        await this.secretin.unshareSecret(secretId, userNoAccess);
      } catch (e) {
        error = e;
      }

      error.should.be.instanceOf(Secretin.Errors.NotSharedWithUserError);
    });

    it('Should be able to renew intermediate key', async () => {
      await this.secretin.loginUser(userReadWriteShare, passwordReadWriteShare);
      await this.secretin.renewKey(secretId);
      this.secretin.currentUser.keys[secretId].key.should.not.equal(
        secretKeyReadWriteShare
      );
      const secret = await this.secretin.getSecret(secretId);
      secret.should.deep.equal(secretContent);
      this.secretin.currentUser.metadatas[secretId].should.deep.equal({
        lastModifiedAt: now,
        lastModifiedBy: userReadWriteShare,
        users: {
          [userRead]: {
            username: userRead,
            rights: 0,
            folders: { ROOT: true },
          },
          [userReadWrite]: {
            username: userReadWrite,
            rights: 1,
            folders: { ROOT: true },
          },
          [userReadWriteShare]: {
            username: userReadWriteShare,
            rights: 2,
            folders: { ROOT: true },
          },
        },
        title: secretTitle,
        type: 'secret',
        id: secretId,
      });
    });

    it('Should not be able to unshare with itself', async () => {
      await this.secretin.loginUser(userReadWriteShare, passwordReadWriteShare);
      let error;
      try {
        await this.secretin.unshareSecret(secretId, userReadWriteShare);
      } catch (e) {
        error = e;
      }

      error.should.be.instanceOf(Secretin.Errors.CantUnshareWithYourselfError);
    });

    it('Should not be able to share with itself', async () => {
      await this.secretin.loginUser(userReadWriteShare, passwordReadWriteShare);
      let error;
      try {
        await this.secretin.shareSecret(secretId, userReadWriteShare, 0);
      } catch (e) {
        error = e;
      }

      error.should.be.instanceOf(Secretin.Errors.CantShareWithYourselfError);
    });
  });
});
