describe('Logged user', () => {
  const now = '2016-01-01T00:00:00.000Z';
  // eslint-disable-next-line
  Date.prototype.toISOString = () => now;

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
  const otherSecretInOtherFolderContent = {
    fields: [
      {
        label: 'e',
        content: 'f',
      },
    ],
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

  const dataToExport = 'test';
  const exportedData = {
    // eslint-disable-next-line
    data: '8bf52e1c2ddef3a4c6bd257b57fb3be67f2a2ff6ab23f180c153de1fe7b2478544195bc437ee280f9692e8c28bed90316b4a46edf1140ec4093bb2634e9416e506747182d8494a24adee742a132ac01d5de873050e94333539c24dd0f7ff1f8799de4f25b09e3ee7451bbc633f1444d793e4bf70d915d0d1bda61aa8f62bcef31f08be6f66095283980bf6f576c7d1101827a3b8edccba12233f488e5419a339e66903fb9e5338c5a0a54db11389a66012a11c170355c0b0426341e731bd60eda06834b724a9cfc475f9311dd14ec0b45b9d28c184d147ed8a0007a0491b0cd70a5d126ed82601b6989f8ff3bb23ff6b4af616788ae4b5a1b29210bf3f808f18313eaec43de625aa3e0428a9506613f061822bfb390c33c5d51193a440dcd8646750cce5b926abaa32b68dba0ec49321f042da3753502d99d6816dd9c0be9b29e938966ae8b9e5073ec3be8f8d123ddf3cd83146f76c066ae54a479472ad298073d78b9b1b604f23dd4b3e79cf4eb55714539ef5e198b0b0466d26ad9d61fa25027e175814e7b97704e6c76d69db2eba7b9e31b62fdcb26a7ba870612388f2bc1fbd6c3f47985eadeab360f454e3ff2ff68e7f6bb6de942c959b773a962081ccafeff78f37e4152fc594073b96297eabe062c1ef237bba75caf67f73f2eefa6ac9835967fdc079c15727c172400edcc112a0f78cfbd2753df356c60388d9e2af',
    // eslint-disable-next-line
    signature: '6dfb8544f56accf650e71c6b5a9f0933931d9f034b8ba9f76b656267302ba765bd1158e247c9abe076ca9371cd19852b52ca7314f1c4d5087e9162fc72b454d4507056f7ed790e1ab94cc06204c829e8e23907d459f6047ddbc5ccd9f0e2d661a3f91ba5e9f904dab1efe920aa58afa8ff30b949fa7295dcc67811ab2d98c78a46632916c8e01ddc97658f2af43c491a8680826df384672d3473f0203aa2dc914ef827674b0522b4960e76d52aa60e7b017286f3236bc0193f34b48bbcdd013b0ab8dcc81e54c0bef66c1ef775aa4fb58d8621ee2b870bd5ee2d746242c18095af058f1f2cc546dade6886b3a5d8437b7b6f1bb8d6d1413f4e8a9bfcf79e8da49bf33038ea98de55fa11d77e88a1bcf03616da2d100ff24a90d9b64567f88f84f3f8e10e8ffec2c62bc2121ffed9cfc1040f331481d8c25c4ba3d57bbd36a2e3071efd254c0833f06573cb8707f8554e175f947180f9637a93795b16e2f3176710dbed1841a7eb568c4da32e14c7e051e7a282e1ff632c926a4277df7396cd4c29d33f1338eb2762011f97a18208f09712ced9ae8fef403c8fb1206ea9be7dbd2988cbc36ca342cab360fefe622b4be92d04d2cf8e455fc3c763b741a41ca9a8424a86f33867398dc246a76f5047dccf3c3c54449016fdd52a112f8d729ff08f2c64276c95d88e1e3568374aa68228eeea7c026d72751bc873dfe8bee0260102',
  };

  const shortpass = 'test';
  const deviceId = '9ad4ab83-9102-470b-b185-a87932774b6b';

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
    localStorage.clear();
    // eslint-disable-next-line
    availableKeyCounter = 0;
    // eslint-disable-next-line
    return resetAndGetDB()
      .then(() => this.secretin.newUser(username, password))
      .then(() => this.secretin.addSecret(secretTitle, secretContent))
      .then(hashedTitle => {
        secretId = hashedTitle;
        return this.secretin.addFolder(folderTitle);
      })
      .then(hashedTitle => {
        folderId = hashedTitle;
        return this.secretin.addFolder(folderInFolderTitle);
      })
      .then(hashedTitle => {
        folderInFolderId = hashedTitle;
        return this.secretin.addFolder(otherFolderTitle);
      })
      .then(hashedTitle => {
        otherFolderId = hashedTitle;
        return this.secretin.addSecret(secretInFolderTitle, secretContent);
      })
      .then(hashedTitle => {
        secretInFolderId = hashedTitle;
        return this.secretin.addSecret(
          otherSecretInOtherFolderTitle,
          otherSecretInOtherFolderContent
        );
      })
      .then(hashedTitle => {
        otherSecretInOtherFolderId = hashedTitle;
        return this.secretin.addSecretToFolder(secretInFolderId, folderId);
      })
      .then(() => this.secretin.addSecretToFolder(folderInFolderId, folderId))
      .then(() =>
        this.secretin.addSecretToFolder(
          otherSecretInOtherFolderId,
          otherFolderId
        ))
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
              [folderId]: true,
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
              [otherFolderId]: true,
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
              [folderId]: true,
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
    return this.secretin.currentUser.metadatas.should.deep.equal(
      expectedMetadatas
    );
  });

  it('Can import database', () => {
    const usernameOld = 'user_old';
    const passwordOld = 'password_old';
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
              [folderId]: true,
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
              [otherFolderId]: true,
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
              [folderId]: true,
            },
          },
        },
        lastModifiedAt: now,
        lastModifiedBy: username,
        title: folderInFolderTitle,
        type: 'folder',
        id: folderInFolderId,
      },
      '00905719c739fcccc8b45613d3bf4da69e2c036f37e77f2f40b23c1d174ce2b5': {
        id: '00905719c739fcccc8b45613d3bf4da69e2c036f37e77f2f40b23c1d174ce2b5',
        lastModifiedAt: now,
        lastModifiedBy: username,
        title: `${secretInFolderTitle}_old`,
        type: 'secret',
        users: {
          [username]: {
            folders: {
              f0d578bd1227b874178621f8a7b2298aca6442b782d399fa42affaa5efdc0cb4: true,
            },
            rights: 2,
            username,
          },
        },
      },
      '1095e5806f1217be96d35c24193bbc65c355dd6d1e58269fb4bd8f9ecee23a1e': {
        id: '1095e5806f1217be96d35c24193bbc65c355dd6d1e58269fb4bd8f9ecee23a1e',
        lastModifiedAt: now,
        lastModifiedBy: username,
        title: `${otherFolderTitle}_old`,
        type: 'folder',
        users: {
          [username]: {
            folders: { ROOT: true },
            rights: 2,
            username,
          },
        },
      },
      '49d78edb5095243ed23e43d45c22fdd9b1ee8aef2711b5d3cd62f9706383dc0b': {
        id: '49d78edb5095243ed23e43d45c22fdd9b1ee8aef2711b5d3cd62f9706383dc0b',
        lastModifiedAt: now,
        lastModifiedBy: username,
        title: `${folderInFolderTitle}_old`,
        type: 'folder',
        users: {
          [username]: {
            folders: {
              f0d578bd1227b874178621f8a7b2298aca6442b782d399fa42affaa5efdc0cb4: true,
            },
            rights: 2,
            username,
          },
        },
      },
      '5dec92bdbdb9284463226e571c8fe953402dfd2426389a1e369c49c2c954bc38': {
        id: '5dec92bdbdb9284463226e571c8fe953402dfd2426389a1e369c49c2c954bc38',
        lastModifiedAt: now,
        lastModifiedBy: username,
        title: `${secretTitle}_old`,
        type: 'secret',
        users: {
          [username]: {
            folders: {
              ROOT: true,
            },
            rights: 2,
            username,
          },
        },
      },
      bb8b69ef509350f7be31d26e9b656d57657518549da5934a0ffaf3a99883d9e3: {
        id: 'bb8b69ef509350f7be31d26e9b656d57657518549da5934a0ffaf3a99883d9e3',
        lastModifiedAt: now,
        lastModifiedBy: username,
        title: `${otherSecretInOtherFolderTitle}_old`,
        type: 'secret',
        users: {
          [username]: {
            folders: {
              '1095e5806f1217be96d35c24193bbc65c355dd6d1e58269fb4bd8f9ecee23a1e': true,
            },
            rights: 2,
            username,
          },
        },
      },
      f0d578bd1227b874178621f8a7b2298aca6442b782d399fa42affaa5efdc0cb4: {
        id: 'f0d578bd1227b874178621f8a7b2298aca6442b782d399fa42affaa5efdc0cb4',
        lastModifiedAt: now,
        lastModifiedBy: username,
        title: `${folderTitle}_old`,
        type: 'folder',
        users: {
          [username]: {
            folders: {
              ROOT: true,
            },
            rights: 2,
            username,
          },
        },
      },
    };
    return (
      this.secretin
        // eslint-disable-next-line
        .importDb(usernameOld, passwordOld, mockedExportedDB)
        .then(() => this.secretin.currentUser.metadatas)
        .should.eventually.deep.equal(expectedMetadatas)
        .then(() => {
          this.secretin.currentUser.disconnect();
          return this.secretin.loginUser(username, password);
        })
        .then(() => this.secretin.currentUser.metadatas)
        .should.eventually.deep.equal(expectedMetadatas)
    );
  });

  it('Can get database', () => {
    let expected;
    let expected2;
    if (__karma__.config.args[0] === 'server') {
      expected = {
        [secretId]: '1',
        [folderId]: '3',
        [otherFolderId]: '2',
        [secretInFolderId]: '2',
        [otherSecretInOtherFolderId]: '2',
        [folderInFolderId]: '2',
      };

      expected2 = {
        [secretId]: '2',
        [folderId]: '3',
        [otherFolderId]: '2',
        [secretInFolderId]: '2',
        [otherSecretInOtherFolderId]: '2',
        [folderInFolderId]: '2',
      };
    } else {
      expected = {
        [secretId]: 'Standalone',
        [folderId]: 'Standalone',
        [otherFolderId]: 'Standalone',
        [secretInFolderId]: 'Standalone',
        [otherSecretInOtherFolderId]: 'Standalone',
        [folderInFolderId]: 'Standalone',
      };

      expected2 = {
        [secretId]: 'Standalone',
        [folderId]: 'Standalone',
        [otherFolderId]: 'Standalone',
        [secretInFolderId]: 'Standalone',
        [otherSecretInOtherFolderId]: 'Standalone',
        [folderInFolderId]: 'Standalone',
      };
    }

    const cacheKey = `${Secretin.prefix}cache_${this.secretin.currentUser.username}`;
    return this.secretin
      .getDb()
      .then(DbCacheStr => {
        const DbCache = JSON.parse(DbCacheStr);
        const revs = {};
        Object.keys(DbCache.secrets).forEach(key => {
          revs[key] = DbCache.secrets[key].rev.split('-')[0];
        });
        return revs;
      })
      .should.eventually.deep.equal(expected)
      .then(() =>
        this.secretin
          .editSecret(secretId, newSecretContent)
          .then(() => this.secretin.getSecret(secretId))
          .then(() => this.secretin.getDb())
          .then(() => localStorage.getItem(cacheKey))
          .then(DbCacheStr => {
            const DbCache = JSON.parse(DbCacheStr);
            const revs = {};
            Object.keys(DbCache.secrets).forEach(key => {
              revs[key] = DbCache.secrets[key].rev.split('-')[0];
            });
            return revs;
          })
          .should.eventually.deep.equal(expected2));
  });

  it('Can refresh infos', () =>
    this.secretin
      .refreshUser()
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
                [folderId]: true,
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
                [otherFolderId]: true,
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
                [folderId]: true,
              },
            },
          },
          lastModifiedAt: now,
          lastModifiedBy: username,
          title: folderInFolderTitle,
          type: 'folder',
          id: folderInFolderId,
        },
      }));

  it('Can retrieve options', () =>
    this.secretin.currentUser.options.should.deep.equal({
      timeToClose: 30,
    }));

  it('Can export private data', () =>
    this.secretin.currentUser
      .exportPrivateData(dataToExport)
      .should.eventually.have.all.keys('data', 'signature'));

  it('Can import private data', () =>
    this.secretin.currentUser
      .importPrivateData(exportedData.data, exportedData.signature)
      .should.eventually.equal(dataToExport));

  it('Can edit options', () =>
    this.secretin
      .editOptions({
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
      }));

  it('Can create secret', () => {
    let hashedTitle;
    return this.secretin
      .addSecret(newSecretTitle, newSecretContent)
      .then(() => {
        let id = -1;
        Object.keys(
          this.secretin.currentUser.metadatas
        ).forEach((mHashedTitle, i) => {
          if (
            this.secretin.currentUser.metadatas[mHashedTitle].title ===
            newSecretTitle
          ) {
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
    return this.secretin
      .addSecret(newSecretTitle, newSecretContent, folderId)
      .then(rHashedTitle => {
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
              [folderId]: true,
            },
          },
        },
        title: newSecretTitle,
        type: 'secret',
      })
      .then(() => this.secretin.getSecret(hashedTitle))
      .should.eventually.deep.equal(newSecretContent)
      .then(() => this.secretin.getSecret(folderId))
      .then(folderContent => Object.keys(folderContent).length)
      .should.eventually.equal(3);
  });

  it('Can create folder', () => {
    let hashedTitle;
    return this.secretin
      .addFolder(newFolderTitle)
      .then(rHashedTitle => {
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
    return this.secretin
      .addFolder(newFolderTitle, folderId)
      .then(rHashedTitle => {
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
              [folderId]: true,
            },
          },
        },
        title: newFolderTitle,
        type: 'folder',
      })
      .then(() => this.secretin.getSecret(hashedTitle))
      .should.eventually.deep.equal({})
      .then(() => this.secretin.getSecret(folderId))
      .then(folderContent => Object.keys(folderContent).length)
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
    this.secretin
      .changePassword(newPassword)
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
      .then(currentUser => currentUser.privateKey)
      .should.eventually.be.instanceOf(CryptoKey));

  it('Can get secret', () =>
    this.secretin
      .getSecret(secretId)
      .should.eventually.deep.equal(secretContent));

  it("Can't get unknown secret", () =>
    this.secretin
      .getSecret(unknownSecretId)
      .should.be.rejectedWith(Secretin.Errors.DontHaveSecretError));

  it('Can edit secret', () =>
    this.secretin
      .editSecret(secretId, newSecretContent)
      .then(() => this.secretin.getSecret(secretId))
      .should.eventually.deep.equal(newSecretContent));

  it('Can rename secret', () =>
    this.secretin
      .renameSecret(secretId, newSecretTitle)
      .then(() => this.secretin.currentUser.metadatas[secretId].title)
      .should.eventually.deep.equal(newSecretTitle));

  it('Can add secret to folder', () => {
    const expectedMetadatas = {
      lastModifiedAt: now,
      lastModifiedBy: username,
      users: {
        [username]: {
          username,
          rights: 2,
          folders: {
            [folderId]: true,
          },
        },
      },
      title: secretTitle,
      type: 'secret',
      id: secretId,
    };
    return this.secretin
      .addSecretToFolder(secretId, folderId)
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
    return this.secretin
      .removeSecretFromFolder(secretInFolderId, folderId)
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
              [folderId]: true,
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
              [otherFolderId]: true,
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
              [folderId]: true,
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
    return this.secretin
      .deleteSecret(secretId)
      .then(() => this.secretin.currentUser.metadatas)
      .should.eventually.deep.equal(expectedMetadatas)
      .then(() => {
        this.secretin.currentUser.disconnect();
        return this.secretin.loginUser(username, password);
      })
      .then(() => this.secretin.currentUser.metadatas)
      .should.eventually.deep.equal(expectedMetadatas);
  });

  it("Can't delete unknown secret", () =>
    this.secretin
      .deleteSecret(unknownSecretId)
      .should.be.rejectedWith(Secretin.Errors.DontHaveSecretError));

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
              [otherFolderId]: true,
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
              [folderId]: true,
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
    return this.secretin
      .deleteSecret(secretInFolderId)
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
              [otherFolderId]: true,
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
    return this.secretin
      .deleteSecret(folderId)
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

  it("Can't share to unknown user", () =>
    this.secretin
      .shareSecret(secretId, unknownUser)
      .should.be.rejectedWith(Secretin.Errors.FriendNotFoundError));

  it("Can't unshare to unknown user", () =>
    this.secretin
      .unshareSecret(secretId, unknownUser)
      .should.be.rejectedWith(Secretin.Errors.NotSharedWithUserError));

  it('Can move secret from folder to subfolder', () => {
    const expectedMetadatas = {
      lastModifiedAt: now,
      lastModifiedBy: username,
      users: {
        [username]: {
          username,
          rights: 2,
          folders: {
            [folderInFolderId]: true,
          },
        },
      },
      title: secretInFolderTitle,
      type: 'secret',
      id: secretInFolderId,
    };
    return this.secretin
      .addSecretToFolder(secretInFolderId, folderInFolderId)
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
              [otherFolderId]: true,
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
              [folderId]: true,
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
              [otherFolderId]: true,
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
              [folderId]: true,
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
    return this.secretin
      .addSecretToFolder(folderId, otherFolderId)
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
            [folderInFolderId]: true,
            [otherFolderId]: true,
          },
        },
      },
      title: otherSecretInOtherFolderTitle,
      type: 'secret',
      id: otherSecretInOtherFolderId,
    };
    return this.secretin
      .addSecretToFolder(otherSecretInOtherFolderId, folderInFolderId)
      .then(
        () => this.secretin.currentUser.metadatas[otherSecretInOtherFolderId]
      )
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
      .then(
        () => this.secretin.currentUser.metadatas[otherSecretInOtherFolderId]
      )
      .should.eventually.deep.equal(expectedMetadatas);
  });

  if (__karma__.config.args[0] === 'server') {
    it('Can activate shortlogin and use it', () =>
      this.secretin
        .activateShortLogin(shortpass, deviceId)
        .then(() => {
          this.secretin.currentUser.disconnect();
          return this.secretin.shortLogin(shortpass);
        })
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
                  [folderId]: true,
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
                  [otherFolderId]: true,
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
                  [folderId]: true,
                },
              },
            },
            lastModifiedAt: now,
            lastModifiedBy: username,
            title: folderInFolderTitle,
            type: 'folder',
            id: folderInFolderId,
          },
        }));
  }
});
