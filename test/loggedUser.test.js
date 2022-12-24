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

  const unknownSecretId =
    'b23a6a8439c0dde5515893e7c90c1e3233b8616e634470f20dc4928bcf3609bc';
  const unknownUser = 'unknownUser';

  const username = 'user';
  const password = 'password';
  const newPassword = 'newPassword';

  const dataToExport = 'test';
  const exportedData = {
    data: '033c3f1fc2908b49219a31b97eba3bebfc8456f1ebdacf51ebe5836d76e599a3eac606a70bb0e39f9f0631d3fdf16e6875fee1debd87bffdd3bd15320486fe564e77667f087f2f3e6fd8a9a8079ba04e6be7a64265ceadbabffa747fd7d13a1bc817fccbc0569ae0ef157598f9a23f5de7035f65f4e295241c0a499ca1aa72cb2c8bcdc8ac458d14c394b7e88acaa94c2928682b8c3eab912fe757017dba3f6ac3f815f84c040878f8bad56dc8e037a7528e0e7ebd35de23b2a4ceae26e70a577e76040a20bf6165dddff93eb5f12f29aa887990c7f3247177301e35b288e6ea5687699a99712e7c2a7972d2a66cd6262dc030ead74ab8c5a883ecd185d17acd3f80f1e2bb9f3f190889bc789334951f0f6f970b5f7aeb81e12287e4c08feb43e26d09af1cff618015de3845cd09d07665adf405c806bf42c5244c4d93667abf3337624ce551bd74d4d82c7589a163adcd5b4441397af4939c5f8ad5f50575d4e61dd22db07b32e6526b9bf98afa0f0b814aedbf5386738d457ca36a13c639c581245a43199c362e3d425791569e51a290e21fc0025e171a360abc6b59224506ddc0f379d18627d2194ce22d5aee48fd5e254295f312ee9992c168ee2f21523198a051c1f2a4f585c2f9078a8d7b21240b73b638812b58b9dbbea5a0af2f0ede683cc0d12853e1fdf44fbe91992697e9ec328e581b5f5e4000282136e4169277',
    signature:
      '1d776d505eadbebc6609d1856f0853cce7dc5e3e35791bc01e5546300d32a681634540652f94af53ff0f8203b92f3e5951a6acf1eb029ebfb2ca38a9b46f7239fefb29ddcc27aebbff92732b6e22e61f1cc8de5aa4bf2c8f45b556b8a669644f617e1940d74a214ba52842c98063f024b22cc7f5290ceb6bf6d6995b197811ef486bff4e2622ccbb930569ca09158a6b03e3f97945748d26e48dc997cfe46a564faf98087dc784c7d78806aa149eaf69c3aaa3a7ec33d1c501663abe0087c057891a8b0adf1a6767d0e3d351cca865d486a8845dbc534a1ca92eae56ee51edb1a066849197cd30716c2d5722248a13aabfb8665c824c1b19d8fed8cca8963864e49e8e13b7f7a4edc5a3f7031238fe1bf3334af191bf34de35837787aa3c74f3722d09bf28ca29c06129b3e58cf566c79b72b7e30ea547faa9a7777f2016555d33792ac89b04d4e91734cc6dc51bfabea23bce2164f609edb6f92fc9ef5d15648d383d16305cc61ecffde2a5e67f5a15ae10886a16436af90051d7f54648464fe45faf33b4510725262ceb94ea9352437f1b2e71bb998d47746377d21e04e05e30ba2150ba3c93d4eb6a4839845fd76f3f82db602cd97271e3f0bddd9aa1b3835cabb3e6f68e557fab82c354dfe0fcfd1f63b2beb11ecd3b05ba77ca0497d418f420aa438b731bf9df13789c854b4af428d1c76744486cc7063e831b972e61f0',
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
  beforeEach(async () => {
    localStorage.clear();
    // eslint-disable-next-line
    availableKeyCounter = 0;
    // eslint-disable-next-line
    await resetAndGetDB();

    await this.secretin.newUser(username, password);
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

    await this.secretin.addSecretToFolder(secretInFolderId, folderId);
    await this.secretin.addSecretToFolder(folderInFolderId, folderId);

    await this.secretin.addSecretToFolder(
      otherSecretInOtherFolderId,
      otherFolderId
    );
    await this.secretin.currentUser.disconnect();
    return this.secretin.loginUser(username, password);
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

  it('Can import database', async () => {
    const passwordOld = 'password_old';

    // eslint-disable-next-line no-undef
    await this.secretin.importDb(passwordOld, mockedExportedDB);
    Object.keys(this.secretin.currentUser.metadatas).length.should.equal(12);
    this.secretin.currentUser.disconnect();
    await this.secretin.loginUser(username, password);
    Object.keys(this.secretin.currentUser.metadatas).length.should.equal(12);
    // eslint-disable-next-line no-undef
    await this.secretin.importDb(passwordOld, mockedExportedDB);
    Object.keys(this.secretin.currentUser.metadatas).length.should.equal(18);
  });

  it('Can export database with password', async () => {
    const passwordExport = 'password_export';
    Object.keys(this.secretin.currentUser.metadatas).length.should.equal(6);
    const jsonDB = await this.secretin.exportDb(passwordExport);

    this.secretin.currentUser.disconnect();
    await this.secretin.loginUser(username, password);

    await this.secretin.importDb(passwordExport, jsonDB);
    Object.keys(this.secretin.currentUser.metadatas).length.should.equal(12);
  });

  it('Can export database without password', async () => {
    Object.keys(this.secretin.currentUser.metadatas).length.should.equal(6);
    const jsonDB = await this.secretin.exportDb();

    this.secretin.currentUser.disconnect();
    await this.secretin.loginUser(username, password);
    await this.secretin.importDb(password, jsonDB);
    Object.keys(this.secretin.currentUser.metadatas).length.should.equal(12);
  });

  it('Can get database', async () => {
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

    const cacheKey = `${Secretin.Utils.SecretinPrefix}cache_${this.secretin.currentUser.username}`;
    const DbCacheStr = await this.secretin.getDb();
    const DbCache = JSON.parse(DbCacheStr);
    const revs = {};
    Object.keys(DbCache.secrets).forEach((key) => {
      revs[key] = DbCache.secrets[key].rev.split('-')[0];
    });
    revs.should.deep.equal(expected);

    await this.secretin.editSecret(secretId, newSecretContent);
    await this.secretin.getSecret(secretId);
    await this.secretin.getDb();
    const DbCacheStr2 = localStorage.getItem(cacheKey);
    const DbCache2 = JSON.parse(DbCacheStr2);
    const revs2 = {};
    Object.keys(DbCache2.secrets).forEach((key) => {
      revs2[key] = DbCache2.secrets[key].rev.split('-')[0];
    });

    revs2.should.deep.equal(expected2);
  });

  it('Can get database', async () => {
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

    const cacheKey = `${Secretin.Utils.SecretinPrefix}cache_${this.secretin.currentUser.username}`;
    const DbCacheStr = await this.secretin.getDb();
    const DbCache = JSON.parse(DbCacheStr);

    const revs = {};
    Object.keys(DbCache.secrets).forEach((key) => {
      revs[key] = DbCache.secrets[key].rev.split('-')[0];
    });

    revs.should.deep.equal(expected);

    await this.secretin.editSecret(secretId, newSecretContent);
    await this.secretin.getSecret(secretId);
    await this.secretin.getDb();
    const DbCacheStr2 = localStorage.getItem(cacheKey);
    const DbCache2 = JSON.parse(DbCacheStr2);

    const revs2 = {};
    Object.keys(DbCache2.secrets).forEach((key) => {
      revs2[key] = DbCache2.secrets[key].rev.split('-')[0];
    });

    revs2.should.deep.equal(expected2);
  });

  it('Can refresh infos', async () => {
    await this.secretin.refreshUser(true);
    this.secretin.currentUser.metadatas.should.deep.equal({
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
    });
  });

  it('Can retrieve options', () =>
    this.secretin.currentUser.options.should.deep.equal({
      timeToClose: 30,
    }));

  it('Can export private data', async () => {
    const exportedPrivateData =
      await this.secretin.currentUser.exportPrivateData(dataToExport);
    exportedPrivateData.should.have.all.keys('data', 'signature');
  });

  it('Can import private data', async () => {
    const importedPrivateData =
      await this.secretin.currentUser.importPrivateData(
        exportedData.data,
        exportedData.signature
      );
    importedPrivateData.should.equal(dataToExport);
  });

  it('Can edit options', async () => {
    await this.secretin.editOptions({
      timeToClose: 60,
    });
    this.secretin.currentUser.options.should.deep.equal({
      timeToClose: 60,
    });

    this.secretin.currentUser.disconnect();
    await this.secretin.loginUser(username, password);
    this.secretin.currentUser.options.should.deep.equal({
      timeToClose: 60,
    });
  });

  it('Can create secret', async () => {
    await this.secretin.addSecret(newSecretTitle, newSecretContent);
    let id = -1;
    Object.keys(this.secretin.currentUser.metadatas).forEach(
      (mHashedTitle, i) => {
        if (
          this.secretin.currentUser.metadatas[mHashedTitle].title ===
          newSecretTitle
        ) {
          id = i;
        }
      }
    );
    const hashedTitle = Object.keys(this.secretin.currentUser.metadatas)[id];
    delete this.secretin.currentUser.metadatas[hashedTitle].id;

    this.secretin.currentUser.metadatas[hashedTitle].should.deep.equal({
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
    });
    const secret = await this.secretin.getSecret(hashedTitle);
    secret.should.deep.equal(newSecretContent);
  });

  it('Can create secret in folder', async () => {
    const hashedTitle = await this.secretin.addSecret(
      newSecretTitle,
      newSecretContent,
      folderId
    );
    delete this.secretin.currentUser.metadatas[hashedTitle].id;

    this.secretin.currentUser.metadatas[hashedTitle].should.deep.equal({
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
    });
    const secret = await this.secretin.getSecret(hashedTitle);
    secret.should.deep.equal(newSecretContent);
    const folder = await this.secretin.getSecret(folderId);
    Object.keys(folder).length.should.equal(3);
  });

  it('Can create folder', async () => {
    const hashedTitle = await this.secretin.addFolder(newFolderTitle);

    delete this.secretin.currentUser.metadatas[hashedTitle].id;
    this.secretin.currentUser.metadatas[hashedTitle].should.deep.equal({
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
    });
    const secret = await this.secretin.getSecret(hashedTitle);
    secret.should.deep.equal({});
  });

  it('Can create folder in folder', async () => {
    const hashedTitle = await this.secretin.addFolder(newFolderTitle, folderId);

    delete this.secretin.currentUser.metadatas[hashedTitle].id;

    this.secretin.currentUser.metadatas[hashedTitle].should.deep.equal({
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
    });
    const secret = await this.secretin.getSecret(hashedTitle);
    secret.should.deep.equal({});
    const folder = await this.secretin.getSecret(folderId);
    Object.keys(folder).length.should.equal(3);
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

  it('Can change its password', async () => {
    await this.secretin.changePassword(newPassword);

    this.secretin.currentUser.disconnect();
    const user = await this.secretin.loginUser(username, newPassword);

    user.should.have.all.keys(
      'totp',
      'username',
      'publicKey',
      'publicKeySign',
      'privateKey',
      'privateKeySign',
      'keys',
      'hash',
      'metadatas',
      'options',
      'cryptoAdapter'
    );
    user.privateKey.should.be.instanceOf(CryptoKey);
  });

  it('Can get secret', async () => {
    const secret = await this.secretin.getSecret(secretId);
    secret.should.deep.equal(secretContent);
  });

  it("Can't get unknown secret", async () => {
    let error;
    try {
      await this.secretin.getSecret(unknownSecretId);
    } catch (e) {
      error = e;
    }

    error.should.be.instanceOf(Secretin.Errors.DontHaveSecretError);
  });

  it('Can edit secret', async () => {
    await this.secretin.editSecret(secretId, newSecretContent);
    const secret = await this.secretin.getSecret(secretId);
    secret.should.deep.equal(newSecretContent);
  });

  it('Can rename secret', async () => {
    await this.secretin.renameSecret(secretId, newSecretTitle);
    this.secretin.currentUser.metadatas[secretId].title.should.deep.equal(
      newSecretTitle
    );
  });

  it('Can add secret to folder', async () => {
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
    await this.secretin.addSecretToFolder(secretId, folderId);
    this.secretin.currentUser.metadatas[secretId].should.deep.equal(
      expectedMetadatas
    );
    const secret = await this.secretin.getSecret(folderId);
    secret.should.deep.equal({
      [secretId]: 1,
      [secretInFolderId]: 1,
      [folderInFolderId]: 1,
    });

    this.secretin.currentUser.disconnect();
    await this.secretin.loginUser(username, password);
    this.secretin.currentUser.metadatas[secretId].should.deep.equal(
      expectedMetadatas
    );
  });

  it('Can remove secret from folder', async () => {
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
    await this.secretin.removeSecretFromFolder(secretInFolderId, folderId);
    this.secretin.currentUser.metadatas[secretInFolderId].should.deep.equal(
      expectedMetadatas
    );
    const secret = await this.secretin.getSecret(folderId);
    secret.should.deep.equal({
      [folderInFolderId]: 1,
    });
    const secret2 = await this.secretin.getSecret(secretInFolderId);
    secret2.should.deep.equal(secretContent);

    this.secretin.currentUser.disconnect();
    await this.secretin.loginUser(username, password);

    this.secretin.currentUser.metadatas[secretInFolderId].should.deep.equal(
      expectedMetadatas
    );
  });

  it('Can delete secret', async () => {
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
    await this.secretin.deleteSecret(secretId);
    this.secretin.currentUser.metadatas.should.deep.equal(expectedMetadatas);

    this.secretin.currentUser.disconnect();
    await this.secretin.loginUser(username, password);

    this.secretin.currentUser.metadatas.should.deep.equal(expectedMetadatas);
  });

  it("Can't delete unknown secret", async () => {
    let error;
    try {
      await this.secretin.deleteSecret(unknownSecretId);
    } catch (e) {
      error = e;
    }
    error.should.be.instanceOf(Secretin.Errors.DontHaveSecretError);
  });

  it('Can delete secret in a folder', async () => {
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
    await this.secretin.deleteSecret(secretInFolderId);
    this.secretin.currentUser.metadatas.should.deep.equal(expectedMetadatas);
    const secret = await this.secretin.getSecret(folderId);
    secret.should.deep.equal({
      [folderInFolderId]: 1,
    });

    this.secretin.currentUser.disconnect();
    await this.secretin.loginUser(username, password);

    this.secretin.currentUser.metadatas.should.deep.equal(expectedMetadatas);
  });

  it('Can delete folder', async () => {
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
    await this.secretin.deleteSecret(folderId);
    this.secretin.currentUser.metadatas.should.deep.equal(expectedMetadatas);
    let error;
    try {
      await this.secretin.getSecret(secretInFolderId);
    } catch (e) {
      error = e;
    }
    error.should.be.instanceOf(Secretin.Errors.DontHaveSecretError);

    this.secretin.currentUser.disconnect();
    await this.secretin.loginUser(username, password);

    this.secretin.currentUser.metadatas.should.deep.equal(expectedMetadatas);
  });

  it("Can't share to unknown user", async () => {
    let error;
    try {
      await this.secretin.shareSecret(secretId, unknownUser);
    } catch (e) {
      error = e;
    }
    error.should.be.instanceOf(Secretin.Errors.FriendNotFoundError);
  });

  it("Can't unshare to unknown user", async () => {
    let error;
    try {
      await this.secretin.unshareSecret(secretId, unknownUser);
    } catch (e) {
      error = e;
    }
    error.should.be.instanceOf(Secretin.Errors.NotSharedWithUserError);
  });

  it('Can move secret from folder to subfolder', async () => {
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
    await this.secretin.addSecretToFolder(secretInFolderId, folderInFolderId);
    this.secretin.currentUser.metadatas[secretInFolderId].should.deep.equal(
      expectedMetadatas
    );
    const secret = await this.secretin.getSecret(folderId);
    secret.should.deep.equal({
      [folderInFolderId]: 1,
    });
    const secret2 = await this.secretin.getSecret(folderInFolderId);
    secret2.should.deep.equal({
      [secretInFolderId]: 1,
    });

    this.secretin.currentUser.disconnect();
    await this.secretin.loginUser(username, password);

    this.secretin.currentUser.metadatas[secretInFolderId].should.deep.equal(
      expectedMetadatas
    );
  });

  it('Can move folder to other folder', async () => {
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
    await this.secretin.addSecretToFolder(folderId, otherFolderId);
    this.secretin.currentUser.metadatas.should.deep.equal(expectedMetadatas);
    const secret = await this.secretin.getSecret(folderId);
    secret.should.deep.equal({
      [folderInFolderId]: 1,
      [secretInFolderId]: 1,
    });
    const secret2 = await this.secretin.getSecret(folderInFolderId);
    secret2.should.deep.equal({});

    this.secretin.currentUser.disconnect();
    await this.secretin.loginUser(username, password);

    this.secretin.currentUser.metadatas.should.deep.equal(expectedMetadatas);
  });

  it('Can add secret in two different folders', async () => {
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
    await this.secretin.addSecretToFolder(
      otherSecretInOtherFolderId,
      folderInFolderId
    );
    this.secretin.currentUser.metadatas[
      otherSecretInOtherFolderId
    ].should.deep.equal(expectedMetadatas);
    const secret = await this.secretin.getSecret(otherFolderId);
    secret.should.deep.equal({
      [otherSecretInOtherFolderId]: 1,
    });
    const secret2 = await this.secretin.getSecret(folderInFolderId);
    secret2.should.deep.equal({
      [otherSecretInOtherFolderId]: 1,
    });

    this.secretin.currentUser.disconnect();
    await this.secretin.loginUser(username, password);

    this.secretin.currentUser.metadatas[
      otherSecretInOtherFolderId
    ].should.deep.equal(expectedMetadatas);
  });

  it('Can generate rescue codes', async () => {
    let protectedRescueCodes;
    const originalPostRescueCodes = this.secretin.api.postRescueCodes;
    this.secretin.api.postRescueCodes = async (user, rescueCodes) => {
      protectedRescueCodes = rescueCodes;
    };

    const rescueCodes = await this.secretin.getRescueCodes();

    rescueCodes.should.deep.equal([
      '39393939',
      '39393939',
      '39393939',
      '39393939',
      '39393939',
    ]);
    protectedRescueCodes.should.deep.equal([
      '5a21fddd',
      '5a21fddd',
      '5a21fddd',
      '5a21fddd',
      '5a21fddd',
    ]);
    this.secretin.api.postRescueCodes = originalPostRescueCodes;
  });

  if (__karma__.config.args[0] === 'server') {
    it('Can activate shortlogin and use it', async () => {
      await this.secretin.activateShortLogin(shortpass, deviceId);

      this.secretin.currentUser.disconnect();
      await this.secretin.shortLogin(shortpass);

      this.secretin.currentUser.metadatas.should.deep.equal({
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
      });
    });
  }
});
