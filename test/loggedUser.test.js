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
  const otherSecretInOtherFolderContent = {
    fields: [{
      label: 'e',
      content: 'f',
    }],
  };

  const newSecretTitle = 'newSecret';

  const secretTitle = 'secret';
  let secretId = '';

  const newFolderTitle = 'newFolder';

  const folderTitle = 'folder';
  let folderId = '';

  const folderInFolderTitle = 'folder in folder';
  let folderInFolderId = '';

  const otherFolderTitle = 'other folder';
  let otherFolderId = '';

  const otherSecretInOtherFolderTitle = 'other secret';
  let otherSecretInOtherFolderId = '';

  const secretInFolderTitle = 'secret in folder';
  let secretInFolderId = '';

  const unknownSecretId = 'b23a6a8439c0dde5515893e7c90c1e3233b8616e634470f20dc4928bcf3609bc';
  const unknownUser = 'unknownUser';

  const username = 'user';
  const password = 'password';
  const newPassword = 'newPassword';

  /*
    Create following arborescence :
      secret
      folder/
          folderInFolder/
          secretInFolder
      otherFolder/
          otherSecret
  */

  // eslint-disable-next-line
  beforeEach(() => {
    localStorage.removeItem(`${Secretin.prefix}cache`);
    // eslint-disable-next-line
    availableKeyCounter = 0;
    // eslint-disable-next-line
    return resetAndGetDB()
      .then(() => this.secretin.newUser(username, password))
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
        return this.secretin.addSecretToFolder(secretInFolderId, folderId);
      })
      .then(() => this.secretin.addSecretToFolder(folderInFolderId, folderId))
      .then(() => this.secretin.addSecretToFolder(otherSecretInOtherFolderId, otherFolderId))
      .then(() => {
        this.secretin.currentUser.disconnect();
        return this.secretin.loginUser(username, password);
      });
  });

  it('Can retrieve metadatas', () => {
    const expectedMetadatas = {
      [secretId]: {
        id: secretId,
        lastModifiedAt: now,
        lastModifiedBy: username,
        title: secretTitle,
        type: 'secret',
        users: {
          [username]: {
            username,
            rights: 2,
            folders: { ROOT: true },
          },
        },
      },
      [folderId]: {
        id: folderId,
        lastModifiedAt: now,
        lastModifiedBy: username,
        title: folderTitle,
        type: 'folder',
        users: {
          [username]: {
            username,
            rights: 2,
            folders: { ROOT: true },
          },
        },
      },
      [otherFolderId]: {
        id: otherFolderId,
        lastModifiedAt: now,
        lastModifiedBy: username,
        title: otherFolderTitle,
        type: 'folder',
        users: {
          [username]: {
            username,
            rights: 2,
            folders: { ROOT: true },
          },
        },
      },
      [secretInFolderId]: {
        users: {
          [username]: {
            username,
            rights: 2,
            folders: {
              [folderId]: {
                name: folderTitle,
              },
            },
          },
        },
        lastModifiedAt: now,
        lastModifiedBy: username,
        title: secretInFolderTitle,
        type: 'secret',
        id: secretInFolderId,
      },
      [otherSecretInOtherFolderId]: {
        users: {
          [username]: {
            username,
            rights: 2,
            folders: {
              [otherFolderId]: {
                name: otherFolderTitle,
              },
            },
          },
        },
        lastModifiedAt: now,
        lastModifiedBy: username,
        title: otherSecretInOtherFolderTitle,
        type: 'secret',
        id: otherSecretInOtherFolderId,
      },
      [folderInFolderId]: {
        users: {
          [username]: {
            username,
            rights: 2,
            folders: {
              [folderId]: {
                name: folderTitle,
              },
            },
          },
        },
        lastModifiedAt: now,
        lastModifiedBy: username,
        title: folderInFolderTitle,
        type: 'folder',
        id: folderInFolderId,
      },
    };
    return this.secretin.currentUser.metadatas.should.deep.equal(expectedMetadatas);
  });

  if (__karma__.config.args[0] === 'server') {
    it('Can get database', () => {
      const expected = {
        [secretId]: '1',
        [folderId]: '3',
        [otherFolderId]: '2',
        [secretInFolderId]: '2',
        [otherSecretInOtherFolderId]: '2',
        [folderInFolderId]: '2',
      };

      const expected2 = {
        [secretId]: '2',
        [folderId]: '3',
        [otherFolderId]: '2',
        [secretInFolderId]: '2',
        [otherSecretInOtherFolderId]: '2',
        [folderInFolderId]: '2',
      };

      const cacheKey = `${Secretin.prefix}cache_${this.secretin.currentUser.username}`;
      return this.secretin.getDb()
        .then((DbCacheStr) => {
          const DbCache = JSON.parse(DbCacheStr);
          const revs = {};
          Object.keys(DbCache.secrets).forEach((key) => {
            revs[key] = DbCache.secrets[key].rev[0];
          });
          return revs;
        })
        .should.eventually.deep.equal(expected)
        .then(() => this.secretin.editSecret(secretId, newSecretContent)
        .then(() => this.secretin.getSecret(secretId))
        .then(() => this.secretin.getDb())
        .then(() => localStorage.getItem(cacheKey))
        .then((DbCacheStr) => {
          const DbCache = JSON.parse(DbCacheStr);
          const revs = {};
          Object.keys(DbCache.secrets).forEach((key) => {
            revs[key] = DbCache.secrets[key].rev[0];
          });
          return revs;
        })
        .should.eventually.deep.equal(expected2));
    });
  }

  it('Can refresh infos', () =>
    this.secretin.refreshUser()
      .then(() => this.secretin.currentUser.metadatas)
      .should.eventually.deep.equal({
        [secretId]: {
          id: secretId,
          lastModifiedAt: now,
          lastModifiedBy: username,
          title: secretTitle,
          type: 'secret',
          users: {
            [username]: {
              username,
              rights: 2,
              folders: { ROOT: true },
            },
          },
        },
        [folderId]: {
          id: folderId,
          lastModifiedAt: now,
          lastModifiedBy: username,
          title: folderTitle,
          type: 'folder',
          users: {
            [username]: {
              username,
              rights: 2,
              folders: { ROOT: true },
            },
          },
        },
        [otherFolderId]: {
          id: otherFolderId,
          lastModifiedAt: now,
          lastModifiedBy: username,
          title: otherFolderTitle,
          type: 'folder',
          users: {
            [username]: {
              username,
              rights: 2,
              folders: { ROOT: true },
            },
          },
        },
        [secretInFolderId]: {
          users: {
            [username]: {
              username,
              rights: 2,
              folders: {
                [folderId]: {
                  name: folderTitle,
                },
              },
            },
          },
          lastModifiedAt: now,
          lastModifiedBy: username,
          title: secretInFolderTitle,
          type: 'secret',
          id: secretInFolderId,
        },
        [otherSecretInOtherFolderId]: {
          users: {
            [username]: {
              username,
              rights: 2,
              folders: {
                [otherFolderId]: {
                  name: otherFolderTitle,
                },
              },
            },
          },
          lastModifiedAt: now,
          lastModifiedBy: username,
          title: otherSecretInOtherFolderTitle,
          type: 'secret',
          id: otherSecretInOtherFolderId,
        },
        [folderInFolderId]: {
          users: {
            [username]: {
              username,
              rights: 2,
              folders: {
                [folderId]: {
                  name: folderTitle,
                },
              },
            },
          },
          lastModifiedAt: now,
          lastModifiedBy: username,
          title: folderInFolderTitle,
          type: 'folder',
          id: folderInFolderId,
        },
      })
  );

  it('Can retrieve options', () =>
    this.secretin.currentUser.options.should.deep.equal({
      timeToClose: 30,
    })
  );

  it('Can edit options', () =>
    this.secretin.editOptions({
      timeToClose: 60,
    })
    .then(() => this.secretin.currentUser.options)
    .should.eventually.deep.equal({
      timeToClose: 60,
    })
    .then(() => {
      this.secretin.currentUser.disconnect();
      return this.secretin.loginUser(username, password);
    })
    .then(() => this.secretin.currentUser.options)
    .should.eventually.deep.equal({
      timeToClose: 60,
    })
  );

  it('Can create secret', () => {
    let hashedTitle;
    return this.secretin.addSecret(newSecretTitle, newSecretContent)
      .then(() => {
        let id = -1;
        Object.keys(this.secretin.currentUser.metadatas).forEach((mHashedTitle, i) => {
          if (this.secretin.currentUser.metadatas[mHashedTitle].title === newSecretTitle) {
            id = i;
          }
        });
        hashedTitle = Object.keys(this.secretin.currentUser.metadatas)[id];
        delete this.secretin.currentUser.metadatas[hashedTitle].id;
        return this.secretin.currentUser.metadatas[hashedTitle];
      })
      .should.eventually.deep.equal({
        lastModifiedAt: now,
        lastModifiedBy: username,
        users: {
          [username]: {
            username,
            rights: 2,
            folders: { ROOT: true },
          },
        },
        title: newSecretTitle,
        type: 'secret',
      })
      .then(() => this.secretin.getSecret(hashedTitle))
      .should.eventually.deep.equal(newSecretContent);
  });

  it('Can create secret in folder', () => {
    let hashedTitle;
    return this.secretin.addSecret(newSecretTitle, newSecretContent, folderId)
      .then((rHashedTitle) => {
        hashedTitle = rHashedTitle;
        delete this.secretin.currentUser.metadatas[hashedTitle].id;
        return this.secretin.currentUser.metadatas[hashedTitle];
      })
      .should.eventually.deep.equal({
        lastModifiedAt: now,
        lastModifiedBy: username,
        users: {
          [username]: {
            username,
            rights: 2,
            folders: {
              [folderId]: {
                name: folderTitle,
              },
            },
          },
        },
        title: newSecretTitle,
        type: 'secret',
      })
      .then(() => this.secretin.getSecret(hashedTitle))
      .should.eventually.deep.equal(newSecretContent)
      .then(() => this.secretin.getSecret(folderId))
      .then((folderContent) => Object.keys(folderContent).length)
      .should.eventually.equal(3);
  });

  it('Can create folder', () => {
    let hashedTitle;
    return this.secretin.addFolder(newFolderTitle)
      .then((rHashedTitle) => {
        hashedTitle = rHashedTitle;
        delete this.secretin.currentUser.metadatas[hashedTitle].id;
        return this.secretin.currentUser.metadatas[hashedTitle];
      })
      .should.eventually.deep.equal({
        lastModifiedAt: now,
        lastModifiedBy: username,
        users: {
          [username]: {
            username,
            rights: 2,
            folders: { ROOT: true },
          },
        },
        title: newFolderTitle,
        type: 'folder',
      })
      .then(() => this.secretin.getSecret(hashedTitle))
      .should.eventually.deep.equal({});
  });

  it('Can create folder in folder', () => {
    let hashedTitle;
    return this.secretin.addFolder(newFolderTitle, folderId)
      .then((rHashedTitle) => {
        hashedTitle = rHashedTitle;
        delete this.secretin.currentUser.metadatas[hashedTitle].id;
        return this.secretin.currentUser.metadatas[hashedTitle];
      })
      .should.eventually.deep.equal({
        lastModifiedAt: now,
        lastModifiedBy: username,
        users: {
          [username]: {
            username,
            rights: 2,
            folders: {
              [folderId]: {
                name: folderTitle,
              },
            },
          },
        },
        title: newFolderTitle,
        type: 'folder',
      })
      .then(() => this.secretin.getSecret(hashedTitle))
      .should.eventually.deep.equal({})
      .then(() => this.secretin.getSecret(folderId))
      .then((folderContent) => Object.keys(folderContent).length)
      .should.eventually.equal(3);
  });

  it('Can disconnect', () => {
    this.secretin.currentUser.disconnect();
    this.secretin.currentUser.should.not.have.any.keys(
      'totp',
      'username',
      'publicKey',
      'publicKeySign',
      'privateKey',
      'privateKeySign',
      'keys',
      'hash',
      'metadatas',
      'options'
    );
  });

  it('Can change its password', () =>
    this.secretin.changePassword(newPassword)
      .then(() => {
        this.secretin.currentUser.disconnect();
        return this.secretin.loginUser(username, newPassword);
      })
      .should.eventually.have.all.keys(
        'totp',
        'username',
        'publicKey',
        'publicKeySign',
        'privateKey',
        'privateKeySign',
        'keys',
        'hash',
        'metadatas',
        'options'
      )
      .then((currentUser) => currentUser.privateKey)
      .should.eventually.be.instanceOf(CryptoKey)
  );

  it('Can get secret', () =>
    this.secretin.getSecret(secretId)
      .should.eventually.deep.equal(secretContent)
  );

  it('Can\'t get unknown secret', () =>
      this.secretin.getSecret(unknownSecretId)
        .should.be.rejectedWith(Secretin.Errors.DontHaveSecretError)
    );

  it('Can edit secret', () =>
    this.secretin.editSecret(secretId, newSecretContent)
      .then(() => this.secretin.getSecret(secretId))
      .should.eventually.deep.equal(newSecretContent)
  );

  it('Can add secret to folder', () => {
    const expectedMetadatas = {
      lastModifiedAt: now,
      lastModifiedBy: username,
      users: {
        [username]: {
          username,
          rights: 2,
          folders: {
            [folderId]: {
              name: folderTitle,
            },
          },
        },
      },
      title: secretTitle,
      type: 'secret',
      id: secretId,
    };
    return this.secretin.addSecretToFolder(secretId, folderId)
      .then(() => this.secretin.currentUser.metadatas[secretId])
      .should.eventually.deep.equal(expectedMetadatas)
      .then(() => this.secretin.getSecret(folderId))
      .should.eventually.deep.equal({
        [secretId]: 1,
        [secretInFolderId]: 1,
        [folderInFolderId]: 1,
      })
      .then(() => {
        this.secretin.currentUser.disconnect();
        return this.secretin.loginUser(username, password);
      })
      .then(() => this.secretin.currentUser.metadatas[secretId])
      .should.eventually.deep.equal(expectedMetadatas);
  });

  it('Can remove secret from folder', () => {
    const expectedMetadatas = {
      lastModifiedAt: now,
      lastModifiedBy: username,
      users: {
        [username]: {
          username,
          rights: 2,
          folders: { ROOT: true },
        },
      },
      title: secretInFolderTitle,
      type: 'secret',
      id: secretInFolderId,
    };
    return this.secretin.removeSecretFromFolder(secretInFolderId, folderId)
      .then(() => this.secretin.currentUser.metadatas[secretInFolderId])
      .should.eventually.deep.equal(expectedMetadatas)
      .then(() => this.secretin.getSecret(folderId))
      .should.eventually.deep.equal({
        [folderInFolderId]: 1,
      })
      .then(() => this.secretin.getSecret(secretInFolderId))
      .should.eventually.deep.equal(secretContent)
      .then(() => {
        this.secretin.currentUser.disconnect();
        return this.secretin.loginUser(username, password);
      })
      .then(() => this.secretin.currentUser.metadatas[secretInFolderId])
      .should.eventually.deep.equal(expectedMetadatas);
  });

  it('Can delete secret', () => {
    const expectedMetadatas = {
      [folderId]: {
        id: folderId,
        lastModifiedAt: now,
        lastModifiedBy: username,
        title: folderTitle,
        type: 'folder',
        users: {
          [username]: {
            username,
            rights: 2,
            folders: { ROOT: true },
          },
        },
      },
      [otherFolderId]: {
        id: otherFolderId,
        lastModifiedAt: now,
        lastModifiedBy: username,
        title: otherFolderTitle,
        type: 'folder',
        users: {
          [username]: {
            username,
            rights: 2,
            folders: { ROOT: true },
          },
        },
      },
      [secretInFolderId]: {
        users: {
          [username]: {
            username,
            rights: 2,
            folders: {
              [folderId]: {
                name: folderTitle,
              },
            },
          },
        },
        lastModifiedAt: now,
        lastModifiedBy: username,
        title: secretInFolderTitle,
        type: 'secret',
        id: secretInFolderId,
      },
      [otherSecretInOtherFolderId]: {
        users: {
          [username]: {
            username,
            rights: 2,
            folders: {
              [otherFolderId]: {
                name: otherFolderTitle,
              },
            },
          },
        },
        lastModifiedAt: now,
        lastModifiedBy: username,
        title: otherSecretInOtherFolderTitle,
        type: 'secret',
        id: otherSecretInOtherFolderId,
      },
      [folderInFolderId]: {
        users: {
          [username]: {
            username,
            rights: 2,
            folders: {
              [folderId]: {
                name: folderTitle,
              },
            },
          },
        },
        lastModifiedAt: now,
        lastModifiedBy: username,
        title: folderInFolderTitle,
        type: 'folder',
        id: folderInFolderId,
      },
    };
    return this.secretin.deleteSecret(secretId)
      .then(() => this.secretin.currentUser.metadatas)
      .should.eventually.deep.equal(expectedMetadatas)
      .then(() => {
        this.secretin.currentUser.disconnect();
        return this.secretin.loginUser(username, password);
      })
      .then(() => this.secretin.currentUser.metadatas)
      .should.eventually.deep.equal(expectedMetadatas);
  });

  it('Can\'t delete unknown secret', () =>
    this.secretin.deleteSecret(unknownSecretId)
      .should.be.rejectedWith(Secretin.Errors.DontHaveSecretError)
  );

  it('Can delete secret in a folder', () => {
    const expectedMetadatas = {
      [secretId]: {
        id: secretId,
        lastModifiedAt: now,
        lastModifiedBy: username,
        title: secretTitle,
        type: 'secret',
        users: {
          [username]: {
            username,
            rights: 2,
            folders: { ROOT: true },
          },
        },
      },
      [folderId]: {
        id: folderId,
        lastModifiedAt: now,
        lastModifiedBy: username,
        title: folderTitle,
        type: 'folder',
        users: {
          [username]: {
            username,
            rights: 2,
            folders: { ROOT: true },
          },
        },
      },
      [otherFolderId]: {
        id: otherFolderId,
        lastModifiedAt: now,
        lastModifiedBy: username,
        title: otherFolderTitle,
        type: 'folder',
        users: {
          [username]: {
            username,
            rights: 2,
            folders: { ROOT: true },
          },
        },
      },
      [otherSecretInOtherFolderId]: {
        users: {
          [username]: {
            username,
            rights: 2,
            folders: {
              [otherFolderId]: {
                name: otherFolderTitle,
              },
            },
          },
        },
        lastModifiedAt: now,
        lastModifiedBy: username,
        title: otherSecretInOtherFolderTitle,
        type: 'secret',
        id: otherSecretInOtherFolderId,
      },
      [folderInFolderId]: {
        users: {
          [username]: {
            username,
            rights: 2,
            folders: {
              [folderId]: {
                name: folderTitle,
              },
            },
          },
        },
        lastModifiedAt: now,
        lastModifiedBy: username,
        title: folderInFolderTitle,
        type: 'folder',
        id: folderInFolderId,
      },
    };
    return this.secretin.deleteSecret(secretInFolderId)
      .then(() => this.secretin.currentUser.metadatas)
      .should.eventually.deep.equal(expectedMetadatas)
      .then(() => this.secretin.getSecret(folderId))
      .should.eventually.deep.equal({
        [folderInFolderId]: 1,
      })
      .then(() => {
        this.secretin.currentUser.disconnect();
        return this.secretin.loginUser(username, password);
      })
      .then(() => this.secretin.currentUser.metadatas)
      .should.eventually.deep.equal(expectedMetadatas);
  });

  it('Can delete folder', () => {
    const expectedMetadatas = {
      [secretId]: {
        id: secretId,
        lastModifiedAt: now,
        lastModifiedBy: username,
        title: secretTitle,
        type: 'secret',
        users: {
          [username]: {
            username,
            rights: 2,
            folders: { ROOT: true },
          },
        },
      },
      [otherFolderId]: {
        id: otherFolderId,
        lastModifiedAt: now,
        lastModifiedBy: username,
        title: otherFolderTitle,
        type: 'folder',
        users: {
          [username]: {
            username,
            rights: 2,
            folders: { ROOT: true },
          },
        },
      },
      [otherSecretInOtherFolderId]: {
        users: {
          [username]: {
            username,
            rights: 2,
            folders: {
              [otherFolderId]: {
                name: otherFolderTitle,
              },
            },
          },
        },
        lastModifiedAt: now,
        lastModifiedBy: username,
        title: otherSecretInOtherFolderTitle,
        type: 'secret',
        id: otherSecretInOtherFolderId,
      },
    };
    return this.secretin.deleteSecret(folderId)
      .then(() => this.secretin.currentUser.metadatas)
      .should.eventually.deep.equal(expectedMetadatas)
      .then(() => this.secretin.getSecret(secretInFolderId))
      .should.be.rejectedWith(Secretin.Errors.DontHaveSecretError)
      .then(() => {
        this.secretin.currentUser.disconnect();
        return this.secretin.loginUser(username, password);
      })
      .then(() => this.secretin.currentUser.metadatas)
      .should.eventually.deep.equal(expectedMetadatas);
  });

  it('Can\'t share to unknown user', () =>
    this.secretin.shareSecret(secretId, unknownUser)
      .should.be.rejectedWith(Secretin.Errors.FriendNotFoundError)
  );

  it('Can\'t unshare to unknown user', () =>
    this.secretin.unshareSecret(secretId, unknownUser)
      .should.be.rejectedWith(Secretin.Errors.NotSharedWithUserError)
  );

  it('Can move secret from folder to subfolder', () => {
    const expectedMetadatas = {
      lastModifiedAt: now,
      lastModifiedBy: username,
      users: {
        [username]: {
          username,
          rights: 2,
          folders: {
            [folderInFolderId]: {
              name: folderInFolderTitle,
            },
          },
        },
      },
      title: secretInFolderTitle,
      type: 'secret',
      id: secretInFolderId,
    };
    return this.secretin.addSecretToFolder(secretInFolderId, folderInFolderId)
      .then(() => this.secretin.currentUser.metadatas[secretInFolderId])
      .should.eventually.deep.equal(expectedMetadatas)
      .then(() => this.secretin.getSecret(folderId))
      .should.eventually.deep.equal({
        [folderInFolderId]: 1,
      })
      .then(() => this.secretin.getSecret(folderInFolderId))
      .should.eventually.deep.equal({
        [secretInFolderId]: 1,
      })
      .then(() => {
        this.secretin.currentUser.disconnect();
        return this.secretin.loginUser(username, password);
      })
      .then(() => this.secretin.currentUser.metadatas[secretInFolderId])
      .should.eventually.deep.equal(expectedMetadatas);
  });

  it('Can move folder to other folder', () => {
    const expectedMetadatas = {
      [secretId]: {
        id: secretId,
        lastModifiedAt: now,
        lastModifiedBy: username,
        title: secretTitle,
        type: 'secret',
        users: {
          [username]: {
            username,
            rights: 2,
            folders: { ROOT: true },
          },
        },
      },
      [folderId]: {
        id: folderId,
        lastModifiedAt: now,
        lastModifiedBy: username,
        title: folderTitle,
        type: 'folder',
        users: {
          [username]: {
            username,
            rights: 2,
            folders: {
              [otherFolderId]: {
                name: otherFolderTitle,
              },
            },
          },
        },
      },
      [otherFolderId]: {
        id: otherFolderId,
        lastModifiedAt: now,
        lastModifiedBy: username,
        title: otherFolderTitle,
        type: 'folder',
        users: {
          [username]: {
            username,
            rights: 2,
            folders: { ROOT: true },
          },
        },
      },
      [secretInFolderId]: {
        users: {
          [username]: {
            username,
            rights: 2,
            folders: {
              [folderId]: {
                name: folderTitle,
              },
            },
          },
        },
        lastModifiedAt: now,
        lastModifiedBy: username,
        title: secretInFolderTitle,
        type: 'secret',
        id: secretInFolderId,
      },
      [otherSecretInOtherFolderId]: {
        users: {
          [username]: {
            username,
            rights: 2,
            folders: {
              [otherFolderId]: {
                name: otherFolderTitle,
              },
            },
          },
        },
        lastModifiedAt: now,
        lastModifiedBy: username,
        title: otherSecretInOtherFolderTitle,
        type: 'secret',
        id: otherSecretInOtherFolderId,
      },
      [folderInFolderId]: {
        users: {
          [username]: {
            username,
            rights: 2,
            folders: {
              [folderId]: {
                name: folderTitle,
              },
            },
          },
        },
        lastModifiedAt: now,
        lastModifiedBy: username,
        title: folderInFolderTitle,
        type: 'folder',
        id: folderInFolderId,
      },
    };
    return this.secretin.addSecretToFolder(folderId, otherFolderId)
      .then(() => this.secretin.currentUser.metadatas)
      .should.eventually.deep.equal(expectedMetadatas)
      .then(() => this.secretin.getSecret(folderId))
      .should.eventually.deep.equal({
        [folderInFolderId]: 1,
        [secretInFolderId]: 1,
      })
      .then(() => this.secretin.getSecret(folderInFolderId))
      .should.eventually.deep.equal({})
      .then(() => {
        this.secretin.currentUser.disconnect();
        return this.secretin.loginUser(username, password);
      })
      .then(() => this.secretin.currentUser.metadatas)
      .should.eventually.deep.equal(expectedMetadatas);
  });

  it('Can add secret in two different folders', () => {
    const expectedMetadatas = {
      lastModifiedAt: now,
      lastModifiedBy: username,
      users: {
        [username]: {
          username,
          rights: 2,
          folders: {
            [folderInFolderId]: {
              name: folderInFolderTitle,
            },
            [otherFolderId]: {
              name: otherFolderTitle,
            },
          },
        },
      },
      title: otherSecretInOtherFolderTitle,
      type: 'secret',
      id: otherSecretInOtherFolderId,
    };
    return this.secretin.addSecretToFolder(otherSecretInOtherFolderId, folderInFolderId)
      .then(() => this.secretin.currentUser.metadatas[otherSecretInOtherFolderId])
      .should.eventually.deep.equal(expectedMetadatas)
      .then(() => this.secretin.getSecret(otherFolderId))
      .should.eventually.deep.equal({
        [otherSecretInOtherFolderId]: 1,
      })
      .then(() => this.secretin.getSecret(folderInFolderId))
      .should.eventually.deep.equal({
        [otherSecretInOtherFolderId]: 1,
      })
      .then(() => {
        this.secretin.currentUser.disconnect();
        return this.secretin.loginUser(username, password);
      })
      .then(() => this.secretin.currentUser.metadatas[otherSecretInOtherFolderId])
      .should.eventually.deep.equal(expectedMetadatas);
  });
});
