describe('Secret accesses', () => {
  const now = '2016-01-01T00:00:00.000Z';
  // eslint-disable-next-line
  Date.prototype.toISOString = () => now;
  const userRead = 'user1';
  const passwordRead = 'password1';

  const userReadWrite = 'user2';
  const passwordReadWrite = 'password2';

  const userReadWriteShare = 'user3';
  const passwordReadWriteShare = 'password3';

  const userNoAccess = 'user4';
  const passwordNoAccess = 'password4';

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

  beforeEach(() => {
    localStorage.clear();
    // eslint-disable-next-line
    availableKeyCounter = 0;
    // eslint-disable-next-line
    return resetAndGetDB()
      .then(() => this.secretin.newUser(userNoAccess, passwordNoAccess))
      .then(() => this.secretin.newUser(userRead, passwordRead))
      .then(() => this.secretin.newUser(userReadWrite, passwordReadWrite))
      .then(() =>
        this.secretin.newUser(userReadWriteShare, passwordReadWriteShare)
      )
      .then(() => this.secretin.addSecret(secretTitle, secretContent))
      .then((hashedTitle) => {
        secretId = hashedTitle;
        secretKeyReadWriteShare = this.secretin.currentUser.keys[secretId].key;
        return this.secretin.shareSecret(secretId, userRead, 0);
      })
      .then(() => this.secretin.shareSecret(secretId, userReadWrite, 1))
      .then(() => {
        this.secretin.currentUser.disconnect();
        return this.secretin.loginUser(userReadWrite, passwordReadWrite);
      })
      .then(() => {
        secretKeyReadWrite = this.secretin.currentUser.keys[secretId].key;
        this.secretin.currentUser.disconnect();
        return this.secretin.loginUser(userRead, passwordRead);
      })
      .then(() => {
        secretKeyRead = this.secretin.currentUser.keys[secretId].key;
        this.secretin.currentUser.disconnect();
      });
  });

  describe('No access user', () => {
    it('Should not be able to read', () =>
      this.secretin
        .loginUser(userNoAccess, passwordNoAccess)
        .then(() => this.secretin.getSecret(secretId))
        .should.be.rejectedWith(Secretin.Errors.DontHaveSecretError));

    it('Should not be able to write', () =>
      this.secretin
        .loginUser(userNoAccess, passwordNoAccess)
        .then(() => this.secretin.editSecret(secretId, newSecretContent))
        .should.be.rejectedWith(Secretin.Errors.DontHaveSecretError));

    it('Should not be able to share', () =>
      this.secretin
        .loginUser(userNoAccess, passwordNoAccess)
        .then(() => this.secretin.shareSecret(secretId, userRead, 0))
        .should.be.rejectedWith(Secretin.Errors.DontHaveSecretError));

    it('Should not be able to unshare', () =>
      this.secretin
        .loginUser(userNoAccess, passwordNoAccess)
        .then(() => this.secretin.unshareSecret(secretId, userRead))
        .should.be.rejectedWith(Secretin.Errors.DontHaveSecretError));

    it('Should not be able to delete', () =>
      this.secretin
        .loginUser(userNoAccess, passwordNoAccess)
        .then(() => this.secretin.deleteSecret(secretId))
        .should.be.rejectedWith(Secretin.Errors.DontHaveSecretError));

    it('Should not be able to renew intermediate key', () =>
      this.secretin
        .loginUser(userNoAccess, passwordNoAccess)
        .then(() => this.secretin.renewKey(secretId))
        .should.eventually.be.rejectedWith(
          Secretin.Errors.DontHaveSecretError
        ));
  });

  describe('Read only user', () => {
    it('Should be able to read', () =>
      this.secretin
        .loginUser(userRead, passwordRead)
        .then(() => this.secretin.getSecret(secretId))
        .should.eventually.deep.equal(secretContent)
        .then(() => this.secretin.currentUser.metadatas[secretId])
        .should.eventually.deep.equal({
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
        }));

    it('Should not be able to write', () =>
      this.secretin
        .loginUser(userRead, passwordRead)
        .then(() => this.secretin.editSecret(secretId, newSecretContent))
        .should.be.rejectedWith(Secretin.Errors.CantEditSecretError));

    it('Should not be able to share', () =>
      this.secretin
        .loginUser(userRead, passwordRead)
        .then(() => this.secretin.shareSecret(secretId, userNoAccess, 0))
        .should.be.rejectedWith(Secretin.Errors.CantShareSecretError));

    it('Should not be able to unshare', () =>
      this.secretin
        .loginUser(userRead, passwordRead)
        .then(() => this.secretin.unshareSecret(secretId, userReadWrite))
        .should.be.rejectedWith(Secretin.Errors.CantUnshareSecretError));

    it('Should not be able to renew intermediate key', () =>
      this.secretin
        .loginUser(userRead, passwordRead)
        .then(() => this.secretin.renewKey(secretId))
        .should.eventually.be.rejectedWith(
          Secretin.Errors.CantGenerateNewKeyError
        )
        .then(() => this.secretin.currentUser.keys[secretId].key)
        .should.eventually.be.equal(secretKeyRead));
  });

  describe('Read/Write only user', () => {
    it('Should be able to read', () =>
      this.secretin
        .loginUser(userReadWrite, passwordReadWrite)
        .then(() => this.secretin.getSecret(secretId))
        .should.eventually.deep.equal(secretContent)
        .then(() => this.secretin.currentUser.metadatas[secretId])
        .should.eventually.deep.equal({
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
        }));

    it('Should be able to write', () =>
      this.secretin
        .loginUser(userReadWrite, passwordReadWrite)
        .then(() => this.secretin.editSecret(secretId, newSecretContent))
        .then(() => this.secretin.getSecret(secretId))
        .should.eventually.deep.equal(newSecretContent)
        .then(() => this.secretin.currentUser.metadatas[secretId])
        .should.eventually.deep.equal({
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
        }));

    it('Should not be able to share', () =>
      this.secretin
        .loginUser(userReadWrite, passwordReadWrite)
        .then(() => this.secretin.shareSecret(secretId, userNoAccess, 0))
        .should.be.rejectedWith(Secretin.Errors.CantShareSecretError));

    it('Should not be able to unshare', () =>
      this.secretin
        .loginUser(userReadWrite, passwordReadWrite)
        .then(() => this.secretin.unshareSecret(secretId, userRead))
        .should.eventually.be.rejectedWith(
          Secretin.Errors.CantUnshareSecretError
        ));

    it('Should not be able to renew intermediate key', () =>
      this.secretin
        .loginUser(userReadWrite, passwordReadWrite)
        .then(() => this.secretin.renewKey(secretId))
        .should.eventually.be.rejectedWith(
          Secretin.Errors.CantGenerateNewKeyError
        )
        .then(() => this.secretin.currentUser.keys[secretId].key)
        .should.eventually.be.equal(secretKeyReadWrite));
  });

  describe('Read/Write/Share only user', () => {
    it('Should be able to read', () =>
      this.secretin
        .loginUser(userReadWriteShare, passwordReadWriteShare)
        .then(() => this.secretin.getSecret(secretId))
        .should.eventually.deep.equal(secretContent)
        .then(() => this.secretin.currentUser.metadatas[secretId])
        .should.eventually.deep.equal({
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
        }));

    it('Should be able to write', () =>
      this.secretin
        .loginUser(userReadWriteShare, passwordReadWriteShare)
        .then(() => this.secretin.editSecret(secretId, secretContent))
        .then(() => this.secretin.getSecret(secretId))
        .should.eventually.deep.equal(secretContent)
        .then(() => this.secretin.currentUser.metadatas[secretId])
        .should.eventually.deep.equal({
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
        }));

    it('Should be able to share', () =>
      this.secretin
        .loginUser(userReadWriteShare, passwordReadWriteShare)
        .then(() => this.secretin.shareSecret(secretId, userNoAccess, 0))
        .then(() => {
          this.secretin.currentUser.disconnect();
          return this.secretin.loginUser(userNoAccess, passwordNoAccess);
        })
        .then(() => this.secretin.getSecret(secretId))
        .should.eventually.deep.equal(secretContent)
        .then(() => this.secretin.currentUser.metadatas[secretId])
        .should.eventually.deep.equal({
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
        }));

    it('Should be able to unshare', () =>
      this.secretin
        .loginUser(userReadWriteShare, passwordReadWriteShare)
        .then(() => this.secretin.unshareSecret(secretId, userRead))
        .then(() => {
          this.secretin.currentUser.disconnect();
          return this.secretin.loginUser(userRead, passwordRead);
        })
        .then(() => this.secretin.getSecret(secretId))
        .should.be.rejectedWith(Secretin.Errors.DontHaveSecretError)
        .then(() => {
          this.secretin.currentUser.disconnect();
          return this.secretin.loginUser(userReadWrite, passwordReadWrite);
        })
        .then(() => this.secretin.getSecret(secretId))
        .should.eventually.deep.equal(secretContent)
        .then(() => this.secretin.currentUser.metadatas[secretId])
        .should.eventually.deep.equal({
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
        }));

    it("Should not be able to unshare with user who don't have access", () =>
      this.secretin
        .loginUser(userReadWriteShare, passwordReadWriteShare)
        .then(() => this.secretin.unshareSecret(secretId, userNoAccess))
        .should.be.rejectedWith(Secretin.Errors.NotSharedWithUserError));

    it('Should be able to renew intermediate key', () =>
      this.secretin
        .loginUser(userReadWriteShare, passwordReadWriteShare)
        .then(() => this.secretin.renewKey(secretId))
        .then(() => this.secretin.currentUser.keys[secretId].key)
        .should.eventually.not.equal(secretKeyReadWriteShare)
        .then(() => this.secretin.getSecret(secretId))
        .should.eventually.deep.equal(secretContent)
        .then(() => this.secretin.currentUser.metadatas[secretId])
        .should.eventually.deep.equal({
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
        }));

    it('Should not be able to unshare with itself', () =>
      this.secretin
        .loginUser(userReadWriteShare, passwordReadWriteShare)
        .then(() => this.secretin.unshareSecret(secretId, userReadWriteShare))
        .should.be.rejectedWith(Secretin.Errors.CantUnshareWithYourselfError));

    it('Should not be able to share with itself', () =>
      this.secretin
        .loginUser(userReadWriteShare, passwordReadWriteShare)
        .then(() => this.secretin.shareSecret(secretId, userReadWriteShare, 0))
        .should.be.rejectedWith(Secretin.Errors.CantShareWithYourselfError));
  });
});
