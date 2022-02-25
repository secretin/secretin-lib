describe('Test history', () => {
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

  const secretInFolderTitle = 'secret in folder';
  let secretInFolderId = '';

  const username = 'user';
  const password = 'password';

  const username2 = 'user2';
  const password2 = 'password2';
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
    await resetAndGetDB()
    await this.secretin.newUser(username2, password2);
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
    await this.secretin.shareSecret(secretInFolderId, username2, 0);
    await this.secretin.currentUser.disconnect();
    await this.secretin.loginUser(username, password);
  });

  it('Can retrieve history', async () => {
    const firstHistory = await this.secretin.getHistory(secretId);
    firstHistory.should.deep.equal([
      {
        secret: secretContent,
        lastModifiedAt: now,
        lastModifiedBy: username,
      },
    ]);
    await this.secretin.editSecret(secretId, newSecretContent);

    const secondHistory = await this.secretin.getHistory(secretId);
    secondHistory.should.deep.equal([
      {
        secret: newSecretContent,
        lastModifiedAt: now,
        lastModifiedBy: username,
      },
      {
        secret: secretContent,
        lastModifiedAt: now,
        lastModifiedBy: username,
      },
    ]);

    await this.secretin.editSecret(secretId, newSecretContent);

    const thirdHistory = await this.secretin.getHistory(secretId);
    thirdHistory.should.deep.equal([
      {
        secret: newSecretContent,
        lastModifiedAt: now,
        lastModifiedBy: username,
      },
      {
        secret: secretContent,
        lastModifiedAt: now,
        lastModifiedBy: username,
      },
    ]);
  });

  it('Can unshare and retrieve history', async () => {
    const firstHistory = await this.secretin.getHistory(secretInFolderId);

    firstHistory.should.deep.equal([
      {
        secret: secretContent,
        lastModifiedAt: now,
        lastModifiedBy: username,
      },
    ]);

    await this.secretin.unshareSecret(secretInFolderId, username2);

    const secondHistory = await this.secretin.getHistory(secretId);

    secondHistory.should.deep.equal([
      {
        secret: secretContent,
        lastModifiedAt: now,
        lastModifiedBy: username,
      },
    ]);
  });
});
