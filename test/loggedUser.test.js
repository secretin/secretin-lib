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
    // eslint-disable-next-line
    data: '8bf52e1c2ddef3a4c6bd257b57fb3be67f2a2ff6ab23f180c153de1fe7b2478544195bc437ee280f9692e8c28bed90316b4a46edf1140ec4093bb2634e9416e506747182d8494a24adee742a132ac01d5de873050e94333539c24dd0f7ff1f8799de4f25b09e3ee7451bbc633f1444d793e4bf70d915d0d1bda61aa8f62bcef31f08be6f66095283980bf6f576c7d1101827a3b8edccba12233f488e5419a339e66903fb9e5338c5a0a54db11389a66012a11c170355c0b0426341e731bd60eda06834b724a9cfc475f9311dd14ec0b45b9d28c184d147ed8a0007a0491b0cd70a5d126ed82601b6989f8ff3bb23ff6b4af616788ae4b5a1b29210bf3f808f18313eaec43de625aa3e0428a9506613f061822bfb390c33c5d51193a440dcd8646750cce5b926abaa32b68dba0ec49321f042da3753502d99d6816dd9c0be9b29e938966ae8b9e5073ec3be8f8d123ddf3cd83146f76c066ae54a479472ad298073d78b9b1b604f23dd4b3e79cf4eb55714539ef5e198b0b0466d26ad9d61fa25027e175814e7b97704e6c76d69db2eba7b9e31b62fdcb26a7ba870612388f2bc1fbd6c3f47985eadeab360f454e3ff2ff68e7f6bb6de942c959b773a962081ccafeff78f37e4152fc594073b96297eabe062c1ef237bba75caf67f73f2eefa6ac9835967fdc079c15727c172400edcc112a0f78cfbd2753df356c60388d9e2af',
    // eslint-disable-next-line
    signature:
      '6dfb8544f56accf650e71c6b5a9f0933931d9f034b8ba9f76b656267302ba765bd1158e247c9abe076ca9371cd19852b52ca7314f1c4d5087e9162fc72b454d4507056f7ed790e1ab94cc06204c829e8e23907d459f6047ddbc5ccd9f0e2d661a3f91ba5e9f904dab1efe920aa58afa8ff30b949fa7295dcc67811ab2d98c78a46632916c8e01ddc97658f2af43c491a8680826df384672d3473f0203aa2dc914ef827674b0522b4960e76d52aa60e7b017286f3236bc0193f34b48bbcdd013b0ab8dcc81e54c0bef66c1ef775aa4fb58d8621ee2b870bd5ee2d746242c18095af058f1f2cc546dade6886b3a5d8437b7b6f1bb8d6d1413f4e8a9bfcf79e8da49bf33038ea98de55fa11d77e88a1bcf03616da2d100ff24a90d9b64567f88f84f3f8e10e8ffec2c62bc2121ffed9cfc1040f331481d8c25c4ba3d57bbd36a2e3071efd254c0833f06573cb8707f8554e175f947180f9637a93795b16e2f3176710dbed1841a7eb568c4da32e14c7e051e7a282e1ff632c926a4277df7396cd4c29d33f1338eb2762011f97a18208f09712ced9ae8fef403c8fb1206ea9be7dbd2988cbc36ca342cab360fefe622b4be92d04d2cf8e455fc3c763b741a41ca9a8424a86f33867398dc246a76f5047dccf3c3c54449016fdd52a112f8d729ff08f2c64276c95d88e1e3568374aa68228eeea7c026d72751bc873dfe8bee0260102',
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
