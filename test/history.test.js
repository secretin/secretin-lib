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
  beforeEach(() => {
    localStorage.clear();
    // eslint-disable-next-line
    availableKeyCounter = 0;
    // eslint-disable-next-line
    return resetAndGetDB()
      .then(() => this.secretin.newUser(username2, password2))
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
        )
      )
      .then(() => this.secretin.shareSecret(secretInFolderId, username2, 0))
      .then(() => {
        this.secretin.currentUser.disconnect();
        return this.secretin.loginUser(username, password);
      });
  });

  it('Can retrieve history', () =>
    this.secretin
      .getHistory(secretId)
      .should.eventually.deep.equal([
        {
          secret: secretContent,
          lastModifiedAt: now,
          lastModifiedBy: username,
        },
      ])
      .then(() => this.secretin.editSecret(secretId, newSecretContent))
      .then(() => this.secretin.getHistory(secretId))
      .should.eventually.deep.equal([
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
      ])
      .then(() => this.secretin.editSecret(secretId, newSecretContent))
      .then(() => this.secretin.getHistory(secretId))
      .should.eventually.deep.equal([
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
      ]));

  it('Can unshare and retrieve history', () =>
    this.secretin
      .getHistory(secretInFolderId)
      .should.eventually.deep.equal([
        {
          secret: secretContent,
          lastModifiedAt: now,
          lastModifiedBy: username,
        },
      ])
      .then(() => this.secretin.unshareSecret(secretInFolderId, username2))
      .then(() => this.secretin.getHistory(secretId))
      .should.eventually.deep.equal([
        {
          secret: secretContent,
          lastModifiedAt: now,
          lastModifiedBy: username,
        },
      ]));
});
