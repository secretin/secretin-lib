/* eslint-disable security/detect-object-injection */
describe('Sharing hell', () => {
  const now = '2016-01-01T00:00:00.000Z';
  // eslint-disable-next-line
  Date.prototype.toISOString = () => now;

  const user1 = 'user1';
  const password1 = 'password1';

  const user2 = 'user2';
  const password2 = 'password2';

  const user3 = 'user3';
  const password3 = 'password3';

  const user4 = 'user4';
  const password4 = 'password4';

  const secretContent = {
    fields: [
      {
        label: 'a',
        content: 'b',
      },
    ],
  };
  const otherSecretInOtherFolderContent = {
    fields: [
      {
        label: 'c',
        content: 'd',
      },
    ],
  };
  const otherSecretInOtherFolderContent2 = {
    fields: [
      {
        label: 'e',
        content: 'f',
      },
    ],
  };

  const user1SecretContent = {
    fields: [
      {
        label: 'g',
        content: 'h',
      },
    ],
  };

  const secretTitle = 'secret';
  let secretId = '';

  const folderTitle = 'folder';
  let folderId = '';

  const folderInFolderTitle = 'folder in folder';
  let folderInFolderId = '';

  const otherFolderTitle = 'other folder';
  let otherFolderId = '';

  const otherSecretInOtherFolderTitle = 'other secret';
  let otherSecretInOtherFolderId = '';

  const otherSecretInOtherFolderTitle2 = 'other secret2';
  let otherSecretInOtherFolderId2 = '';

  const secretInFolderTitle = 'secret in folder';
  let secretInFolderId = '';

  const user1SecretTitle = 'user1 secret';
  /*
    Create following arborescence by user3 :
      secret (user4)
      folder/ (user1 and user2)
          folderInFolder/
          secretInFolder
      otherFolder/ (user4)
          otherSecret
          otherSecret2
  */

  beforeEach(async () => {
    localStorage.clear();
    // eslint-disable-next-line
    availableKeyCounter = 0;
    // eslint-disable-next-line
    await resetAndGetDB()
    await this.secretin.newUser(user1, password1);
    await this.secretin.newUser(user2, password2);
    await this.secretin.newUser(user4, password4);
    await this.secretin.newUser(user3, password3);
    secretId = await this.secretin.addSecret(secretTitle, secretContent);

    folderId = await this.secretin.addFolder(folderTitle);

    folderInFolderId = await this.secretin.addFolder(folderInFolderTitle);

    otherFolderId = await this.secretin.addFolder(otherFolderTitle);

    secretInFolderId = await this.secretin.addSecret(
      secretInFolderTitle,
      secretContent
    );

    otherSecretInOtherFolderId = await this.secretin.addSecret(
      otherSecretInOtherFolderTitle,
      otherSecretInOtherFolderContent
    );

    otherSecretInOtherFolderId2 = await this.secretin.addSecret(
      otherSecretInOtherFolderTitle2,
      otherSecretInOtherFolderContent2
    );

    await this.secretin.addSecretToFolder(secretInFolderId, folderId);
    await this.secretin.addSecretToFolder(folderInFolderId, folderId);

    await this.secretin.addSecretToFolder(
      otherSecretInOtherFolderId,
      otherFolderId
    );
    await this.secretin.addSecretToFolder(
      otherSecretInOtherFolderId2,
      otherFolderId
    );
    await this.secretin.shareSecret(secretId, user4, 0);
    await this.secretin.shareSecret(otherFolderId, user4, 0);
    await this.secretin.shareSecret(folderId, user1, 0);
    await this.secretin.shareSecret(folderId, user2, 1);
    this.secretin.currentUser.disconnect();
  });

  it('Metadatas are valid', async () => {
    const expectedMetadatas = {
      [secretId]: {
        id: secretId,
        lastModifiedAt: now,
        lastModifiedBy: user3,
        title: secretTitle,
        type: 'secret',
        users: {
          [user4]: {
            username: user4,
            rights: 0,
            folders: { ROOT: true },
          },
          [user3]: {
            username: user3,
            rights: 2,
            folders: { ROOT: true },
          },
        },
      },
      [folderId]: {
        id: folderId,
        lastModifiedAt: now,
        lastModifiedBy: user3,
        title: folderTitle,
        type: 'folder',
        users: {
          [user1]: {
            username: user1,
            rights: 0,
            folders: { ROOT: true },
          },
          [user2]: {
            username: user2,
            rights: 1,
            folders: { ROOT: true },
          },
          [user3]: {
            username: user3,
            rights: 2,
            folders: { ROOT: true },
          },
        },
      },
      [otherFolderId]: {
        id: otherFolderId,
        lastModifiedAt: now,
        lastModifiedBy: user3,
        title: otherFolderTitle,
        type: 'folder',
        users: {
          [user4]: {
            username: user4,
            rights: 0,
            folders: { ROOT: true },
          },
          [user3]: {
            username: user3,
            rights: 2,
            folders: { ROOT: true },
          },
        },
      },
      [secretInFolderId]: {
        users: {
          [user1]: {
            username: user1,
            rights: 0,
            folders: {
              [folderId]: true,
            },
          },
          [user2]: {
            username: user2,
            rights: 1,
            folders: {
              [folderId]: true,
            },
          },
          [user3]: {
            username: user3,
            rights: 2,
            folders: {
              [folderId]: true,
            },
          },
        },
        lastModifiedAt: now,
        lastModifiedBy: user3,
        title: secretInFolderTitle,
        type: 'secret',
        id: secretInFolderId,
      },
      [otherSecretInOtherFolderId]: {
        users: {
          [user4]: {
            username: user4,
            rights: 0,
            folders: {
              [otherFolderId]: true,
            },
          },
          [user3]: {
            username: user3,
            rights: 2,
            folders: {
              [otherFolderId]: true,
            },
          },
        },
        lastModifiedAt: now,
        lastModifiedBy: user3,
        title: otherSecretInOtherFolderTitle,
        type: 'secret',
        id: otherSecretInOtherFolderId,
      },
      [otherSecretInOtherFolderId2]: {
        users: {
          [user3]: {
            username: user3,
            rights: 2,
            folders: {
              [otherFolderId]: true,
            },
          },
          [user4]: {
            username: user4,
            rights: 0,
            folders: {
              [otherFolderId]: true,
            },
          },
        },
        lastModifiedAt: now,
        lastModifiedBy: user3,
        title: otherSecretInOtherFolderTitle2,
        type: 'secret',
        id: otherSecretInOtherFolderId2,
      },
      [folderInFolderId]: {
        users: {
          [user1]: {
            username: user1,
            rights: 0,
            folders: {
              [folderId]: true,
            },
          },
          [user2]: {
            username: user2,
            rights: 1,
            folders: {
              [folderId]: true,
            },
          },
          [user3]: {
            username: user3,
            rights: 2,
            folders: {
              [folderId]: true,
            },
          },
        },
        lastModifiedAt: now,
        lastModifiedBy: user3,
        title: folderInFolderTitle,
        type: 'folder',
        id: folderInFolderId,
      },
    };
    await this.secretin.loginUser(user3, password3);
    this.secretin.currentUser.metadatas.should.deep.equal(expectedMetadatas);
  });

  it('Add secret to a folder with multiple users', async () => {
    const expectedMetadatas = {
      id: secretId,
      lastModifiedAt: now,
      lastModifiedBy: user3,
      title: secretTitle,
      type: 'secret',
      users: {
        [user4]: {
          username: user4,
          rights: 0,
          folders: { ROOT: true },
        },
        [user1]: {
          username: user1,
          rights: 0,
          folders: {
            [folderId]: true,
          },
        },
        [user2]: {
          username: user2,
          rights: 1,
          folders: {
            [folderId]: true,
          },
        },
        [user3]: {
          username: user3,
          rights: 2,
          folders: {
            [folderId]: true,
          },
        },
      },
    };
    await this.secretin.loginUser(user3, password3);
    await this.secretin.addSecretToFolder(secretId, folderId);

    this.secretin.currentUser.metadatas[secretId].should.deep.equal(
      expectedMetadatas
    );

    this.secretin.currentUser.disconnect();
    await this.secretin.loginUser(user1, password1);

    const secret = await this.secretin.getSecret(secretId);
    secret.should.deep.equal(secretContent);

    this.secretin.currentUser.disconnect();
    await this.secretin.loginUser(user4, password4);

    const secret2 = await this.secretin.getSecret(secretId);
    secret2.should.deep.equal(secretContent);

    this.secretin.currentUser.disconnect();
    await this.secretin.loginUser(user2, password2);

    const secret3 = await this.secretin.getSecret(secretId);
    secret3.should.deep.equal(secretContent);
  });

  it('Unshare secret with one user in folder', async () => {
    const expectedMetadatas = {
      id: secretInFolderId,
      lastModifiedAt: now,
      lastModifiedBy: user3,
      title: secretInFolderTitle,
      type: 'secret',
      users: {
        [user2]: {
          username: user2,
          rights: 1,
          folders: {
            [folderId]: true,
          },
        },
        [user3]: {
          username: user3,
          rights: 2,
          folders: {
            [folderId]: true,
          },
        },
      },
    };
    await this.secretin.loginUser(user3, password3);
    await this.secretin.unshareSecret(secretInFolderId, user1);

    this.secretin.currentUser.metadatas[secretInFolderId].should.deep.equal(
      expectedMetadatas
    );

    this.secretin.currentUser.disconnect();
    await this.secretin.loginUser(user2, password2);
    const secret = await this.secretin.getSecret(secretInFolderId);
    secret.should.deep.equal(secretContent);

    this.secretin.currentUser.disconnect();
    await this.secretin.loginUser(user1, password1);
    let error;
    try {
      await this.secretin.getSecret(secretInFolderId);
    } catch (e) {
      error = e;
    }
    error.should.be.instanceOf(Secretin.Errors.DontHaveSecretError);
  });

  it("User can't share secret in read only folder", async () => {
    const expectedMetadatas = {
      lastModifiedAt: now,
      lastModifiedBy: user1,
      title: user1SecretTitle,
      type: 'secret',
      users: {
        [user1]: {
          username: user1,
          rights: 2,
          folders: {
            ROOT: true,
          },
        },
      },
    };

    await this.secretin.loginUser(user1, password1);
    const user1SecretId = await this.secretin.addSecret(
      user1SecretTitle,
      user1SecretContent
    );
    let error;
    try {
      await this.secretin.addSecretToFolder(user1SecretId, folderId);
    } catch (e) {
      error = e;
    }

    error.should.be.instanceOf(Secretin.Errors.CantEditSecretError);

    delete this.secretin.currentUser.metadatas[user1SecretId].id;
    this.secretin.currentUser.metadatas[user1SecretId].should.deep.equal(
      expectedMetadatas
    );
  });
});
