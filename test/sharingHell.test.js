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

  beforeEach(() => {
    localStorage.clear();
    // eslint-disable-next-line
    availableKeyCounter = 0;
    // eslint-disable-next-line
    return resetAndGetDB()
      .then(() => this.secretin.newUser(user1, password1))
      .then(() => this.secretin.newUser(user2, password2))
      .then(() => this.secretin.newUser(user4, password4))
      .then(() => this.secretin.newUser(user3, password3))
      .then(() => this.secretin.addSecret(secretTitle, secretContent))
      .then((hashedTitle) => {
        secretId = hashedTitle;
        return this.secretin.addFolder(folderTitle);
      })
      .then((hashedTitle) => {
        folderId = hashedTitle;
        return this.secretin.addFolder(folderInFolderTitle);
      })
      .then((hashedTitle) => {
        folderInFolderId = hashedTitle;
        return this.secretin.addFolder(otherFolderTitle);
      })
      .then((hashedTitle) => {
        otherFolderId = hashedTitle;
        return this.secretin.addSecret(secretInFolderTitle, secretContent);
      })
      .then((hashedTitle) => {
        secretInFolderId = hashedTitle;
        return this.secretin.addSecret(
          otherSecretInOtherFolderTitle,
          otherSecretInOtherFolderContent
        );
      })
      .then((hashedTitle) => {
        otherSecretInOtherFolderId = hashedTitle;
        return this.secretin.addSecret(
          otherSecretInOtherFolderTitle2,
          otherSecretInOtherFolderContent2
        );
      })
      .then((hashedTitle) => {
        otherSecretInOtherFolderId2 = hashedTitle;
        return this.secretin.addSecretToFolder(secretInFolderId, folderId);
      })
      .then(() => this.secretin.addSecretToFolder(folderInFolderId, folderId))
      .then(() =>
        this.secretin.addSecretToFolder(
          otherSecretInOtherFolderId,
          otherFolderId
        )
      )
      .then(() =>
        this.secretin.addSecretToFolder(
          otherSecretInOtherFolderId2,
          otherFolderId
        )
      )
      .then(() => this.secretin.shareSecret(secretId, user4, 0))
      .then(() => this.secretin.shareSecret(otherFolderId, user4, 0))
      .then(() => this.secretin.shareSecret(folderId, user1, 0))
      .then(() => this.secretin.shareSecret(folderId, user2, 1))
      .then(() => this.secretin.currentUser.disconnect());
  });

  it('Metadatas are valid', () => {
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
    return this.secretin
      .loginUser(user3, password3)
      .then(() =>
        this.secretin.currentUser.metadatas.should.deep.equal(expectedMetadatas)
      );
  });

  it('Add secret to a folder with multiple users', () => {
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
    return this.secretin
      .loginUser(user3, password3)
      .then(() => this.secretin.addSecretToFolder(secretId, folderId))
      .then(() =>
        this.secretin.currentUser.metadatas[secretId].should.deep.equal(
          expectedMetadatas
        )
      )
      .then(() => {
        this.secretin.currentUser.disconnect();
        return this.secretin.loginUser(user1, password1);
      })
      .then(() => this.secretin.getSecret(secretId))
      .then((secret) => secret.should.deep.equal(secretContent))
      .then(() => {
        this.secretin.currentUser.disconnect();
        return this.secretin.loginUser(user4, password4);
      })
      .then(() => this.secretin.getSecret(secretId))
      .then((secret) => secret.should.deep.equal(secretContent))
      .then(() => {
        this.secretin.currentUser.disconnect();
        return this.secretin.loginUser(user2, password2);
      })
      .then(() => this.secretin.getSecret(secretId))
      .then((secret) => secret.should.deep.equal(secretContent));
  });

  it('Unshare secret with one user in folder', () => {
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
    return this.secretin
      .loginUser(user3, password3)
      .then(() => this.secretin.unshareSecret(secretInFolderId, user1))
      .then(() =>
        this.secretin.currentUser.metadatas[secretInFolderId].should.deep.equal(
          expectedMetadatas
        )
      )
      .then(() => {
        this.secretin.currentUser.disconnect();
        return this.secretin.loginUser(user2, password2);
      })
      .then(() => this.secretin.getSecret(secretInFolderId))
      .then((secret) => secret.should.deep.equal(secretContent))
      .then(() => {
        this.secretin.currentUser.disconnect();
        return this.secretin.loginUser(user1, password1);
      })
      .then(() => this.secretin.getSecret(secretInFolderId))
      .should.be.rejectedWith(Secretin.Errors.DontHaveSecretError);
  });

  it("User can't share secret in read only folder", () => {
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
    let user1SecretId;
    return this.secretin
      .loginUser(user1, password1)
      .then(() => this.secretin.addSecret(user1SecretTitle, user1SecretContent))
      .then((rUser1SecretId) => {
        user1SecretId = rUser1SecretId;
        return this.secretin.addSecretToFolder(user1SecretId, folderId);
      })
      .should.be.rejectedWith(Secretin.Errors.CantEditSecretError)
      .then(() => {
        delete this.secretin.currentUser.metadatas[user1SecretId].id;
        return this.secretin.currentUser.metadatas[
          user1SecretId
        ].should.deep.equal(expectedMetadatas);
      });
  });
});
