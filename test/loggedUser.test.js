describe('Logged user', () => {
  const now = '2016-01-01T00:00:00.000Z';
  // eslint-disable-next-line
  Date.prototype.toISOString = () => now;

  const secretContent = {
    fields: [{
      label: 'a',
      content: 'b',
    }],
  };
  const newSecretContent = {
    fields: [{
      label: 'c',
      content: 'd',
    }],
  };

  const secretTitle = 'secret';
  let secretId = '';

  const folderTitle = 'folder';
  let folderId = '';

  const secretInFolderTitle = 'secret in folder';
  let secretInFolderId = '';

  const username = 'user';
  const password = 'password';
  const newPassword = 'newPassword';

  // eslint-disable-next-line
  before(() => resetAndGetDB()
    .then(() => this.secretin.newUser(username, password))
    .then(() => this.secretin.addSecret(secretTitle, secretContent))
    .then((hashedTitle) => {
      secretId = hashedTitle;
      return this.secretin.addFolder(folderTitle);
    })
    .then((hashedTitle) => {
      folderId = hashedTitle;
      return this.secretin.addSecret(secretInFolderTitle, secretContent);
    })
    .then((hashedTitle) => {
      secretInFolderId = hashedTitle;
      return this.secretin.addSecretToFolder(secretInFolderId, folderId);
    })
  );

  beforeEach(() => {
    this.secretin.currentUser.disconnect();
    return this.secretin.loginUser(username, password);
  });

  it('Can retrieve metadatas', () => {
    this.secretin.currentUser.metadatas.should.deep.equal({
      [secretId]: {
        folders: {},
        id: secretId,
        lastModifiedAt: now,
        lastModifiedBy: username,
        title: secretTitle,
        type: 'secret',
        users: {
          [username]: {
            username,
            rights: 2,
          },
        },
      },
      [folderId]: {
        folders: {},
        id: folderId,
        lastModifiedAt: now,
        lastModifiedBy: username,
        title: folderTitle,
        type: 'folder',
        users: {
          [username]: {
            username,
            rights: 2,
          },
        },
      },
      [secretInFolderId]: {
        users: {
          [username]: {
            username,
            rights: 2,
            folder: 'folder',
          },
        },
        lastModifiedAt: now,
        lastModifiedBy: username,
        folders: {
          [folderId]: {
            name: folderTitle,
          },
        },
        title: secretInFolderTitle,
        type: 'secret',
        id: secretInFolderId,
      },
    });
  });

  it('Can create secret', () => {
    let hashedTitle;
    return this.secretin.addSecret(secretTitle, newSecretContent)
      .then(() => {
        let id = -1;
        Object.keys(this.secretin.currentUser.metadatas).forEach((mHashedTitle, i) => {
          if (this.secretin.currentUser.metadatas[mHashedTitle].title === secretTitle) {
            id = i;
          }
        });
        hashedTitle = Object.keys(this.secretin.currentUser.metadatas)[id];
        delete this.secretin.currentUser.metadatas[hashedTitle].id;
        return this.secretin.currentUser.metadatas[hashedTitle];
      })
      .should.eventually.deep.equal({
        lastModifiedAt: '2016-01-01T00:00:00.000Z',
        lastModifiedBy: username,
        users: {
          [username]: {
            username,
            rights: 2,
          },
        },
        folders: {},
        title: secretTitle,
        type: 'secret',
      })
      .then(() => this.secretin.getSecret(hashedTitle))
      .should.eventually.deep.equal(newSecretContent)
      .then(() => this.secretin.deleteSecret(hashedTitle));
  });

  it('Can create folder', () => {
    const newFolderTitle = 'folder1';
    let hashedTitle;
    return this.secretin.addFolder(newFolderTitle)
      .then(() => {
        let id = -1;
        Object.keys(this.secretin.currentUser.metadatas).forEach((mHashedTitle, i) => {
          if (this.secretin.currentUser.metadatas[mHashedTitle].title === newFolderTitle) {
            id = i;
          }
        });
        hashedTitle = Object.keys(this.secretin.currentUser.metadatas)[id];
        delete this.secretin.currentUser.metadatas[hashedTitle].id;
        return this.secretin.currentUser.metadatas[hashedTitle];
      })
      .should.eventually.deep.equal({
        lastModifiedAt: '2016-01-01T00:00:00.000Z',
        lastModifiedBy: username,
        users: {
          [username]: {
            username,
            rights: 2,
          },
        },
        folders: {},
        title: newFolderTitle,
        type: 'folder',
      })
      .then(() => this.secretin.getSecret(hashedTitle))
      .should.eventually.deep.equal({})
      .then(() => this.secretin.deleteSecret(hashedTitle));
  });

  it('Can disconnect', () => {
    this.secretin.currentUser.disconnect();
    this.secretin.currentUser.should.not.have.any.keys(
      'totp',
      'username',
      'publicKey',
      'privateKey',
      'keys',
      'hash',
      'metadatas',
      'token'
    );
  });

  it('Can change its password', () => this.secretin.changePassword(newPassword)
      .then(() => {
        this.secretin.currentUser.disconnect();
        return this.secretin.loginUser(username, newPassword);
      })
      .should.eventually.have.all.keys(
        'totp',
        'username',
        'publicKey',
        'privateKey',
        'keys',
        'hash',
        'metadatas',
        'token'
      )
      .then((currentUser) => currentUser.privateKey)
      .should.eventually.be.instanceOf(CryptoKey)
      .then(() => this.secretin.changePassword(password))
  );

  it('Can get secret', () => this.secretin.getSecret(secretId)
      .should.eventually.deep.equal(secretContent)
  );

  it('Can edit secret', () => this.secretin.editSecret(secretId, newSecretContent)
      .then(() => this.secretin.getSecret(secretId))
      .should.eventually.deep.equal(newSecretContent)
      .then(() => this.secretin.editSecret(secretId, secretContent))
  );

  it('Can add secret to folder', () => this.secretin.addSecretToFolder(secretId, folderId)
      .then(() => this.secretin.currentUser.metadatas[secretId])
      .should.eventually.deep.equal({
        lastModifiedAt: '2016-01-01T00:00:00.000Z',
        lastModifiedBy: username,
        users: {
          [username]: {
            username,
            rights: 2,
            folder: folderTitle,
          },
        },
        folders: {
          [folderId]: {
            name: folderTitle,
          },
        },
        title: secretTitle,
        type: 'secret',
        id: secretId,
      })
      .then(() => this.secretin.getSecret(folderId))
      .should.eventually.deep.equal({
        [secretId]: 1,
        [secretInFolderId]: 1,
      })
      .then(() => this.secretin.removeSecretFromFolder(secretId, folderId))
  );

  it('Can remove secret from folder', () =>
    this.secretin.removeSecretFromFolder(secretInFolderId, folderId)
      .then(() => this.secretin.currentUser.metadatas[secretInFolderId])
      .should.eventually.deep.equal({
        lastModifiedAt: '2016-01-01T00:00:00.000Z',
        lastModifiedBy: username,
        users: {
          [username]: {
            username,
            rights: 2,
          },
        },
        folders: {},
        title: secretInFolderTitle,
        type: 'secret',
        id: secretInFolderId,
      })
      .then(() => this.secretin.getSecret(folderId))
      .should.eventually.deep.equal({})
      .then(() => this.secretin.getSecret(secretInFolderId))
      .should.eventually.deep.equal({
        fields: [{
          label: 'a',
          content: 'b',
        }],
      })
      .then(() => this.secretin.addSecretToFolder(secretInFolderId, folderId))
  );

  it('Can delete secret', () => this.secretin.deleteSecret(secretId)
      .then(() => this.secretin.currentUser.metadatas)
      .should.eventually.deep.equal({
        [folderId]: {
          folders: {},
          id: folderId,
          lastModifiedAt: now,
          lastModifiedBy: username,
          title: folderTitle,
          type: 'folder',
          users: {
            [username]: {
              username,
              rights: 2,
            },
          },
        },
        [secretInFolderId]: {
          users: {
            [username]: {
              username,
              rights: 2,
              folder: 'folder',
            },
          },
          lastModifiedAt: now,
          lastModifiedBy: username,
          folders: {
            [folderId]: {
              name: folderTitle,
            },
          },
          title: secretInFolderTitle,
          type: 'secret',
          id: secretInFolderId,
        },
      })
  );

  it('Can delete secret in a folder', () => this.secretin.deleteSecret(secretInFolderId)
      .then(() => this.secretin.currentUser.metadatas)
      .should.eventually.deep.equal({
        [folderId]: {
          folders: {},
          id: folderId,
          lastModifiedAt: now,
          lastModifiedBy: username,
          title: folderTitle,
          type: 'folder',
          users: {
            [username]: {
              username,
              rights: 2,
            },
          },
        },
      })
      .then(() => this.secretin.getSecret(folderId))
      .should.eventually.deep.equal({})
  );
});
