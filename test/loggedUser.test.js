// eslint-disable-next-line
Date.prototype.toISOString = () => '2016-01-01T00:00:00.000Z';

describe('Logged user', () => {
  const username = 'user1';
  const password = 'password';

  beforeEach(() => {
    this.secretin = new Secretin();
    // eslint-disable-next-line
    const newDB = JSON.parse(JSON.stringify(db));
    this.secretin.changeDB(newDB);
    return this.secretin.loginUser(username, password);
  });

  it('Can retrieve metadatas', () => {
    this.secretin.currentUser.metadatas.should.deep.equal({
      f62c937bdaf1ae0efab60a275e0f9080c79511095569e06d431423e1ac971772: {
        folders: {},
        id: 'f62c937bdaf1ae0efab60a275e0f9080c79511095569e06d431423e1ac971772',
        lastModifiedAt: '2016-09-17T23:41:23.071Z',
        lastModifiedBy: 'user1',
        title: 'secret',
        type: 'secret',
        users: {
          user1: {
            username: 'user1',
            rights: 2,
          },
        },
      },
      '0839fb4655ea32255f60e4e37fe07e207be65774d8a9255bc9344403faeaead7': {
        folders: {},
        id: '0839fb4655ea32255f60e4e37fe07e207be65774d8a9255bc9344403faeaead7',
        lastModifiedAt: '2016-09-17T23:41:33.936Z',
        lastModifiedBy: 'user1',
        title: 'folder',
        type: 'folder',
        users: {
          user1: {
            username: 'user1',
            rights: 2,
          },
        },
      },
      fe40e52d903d821e696d366aa9c9e383de2c1486b90166f458eb99788660f545: {
        users: {
          user1: {
            username: 'user1',
            rights: 2,
            folder: 'folder',
          },
        },
        lastModifiedAt: '2016-09-17T23:41:33.897Z',
        lastModifiedBy: 'user1',
        folders: {
          '0839fb4655ea32255f60e4e37fe07e207be65774d8a9255bc9344403faeaead7': {
            name: 'folder',
          },
        },
        title: 'secret in folder',
        type: 'secret',
        id: 'fe40e52d903d821e696d366aa9c9e383de2c1486b90166f458eb99788660f545',
      },
    });
  });

  it('Can create secret', () => {
    const secretContent = 'This is secret';
    const secretTitle = 'secret1';
    let hashedTitle;
    return this.secretin.addSecret(secretTitle, secretContent)
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
        lastModifiedBy: 'user1',
        users: {
          user1: {
            username: 'user1',
            rights: 2,
          },
        },
        folders: {},
        title: secretTitle,
        type: 'secret',
      })
      .then(() => this.secretin.getSecret(hashedTitle))
      .should.eventually.equal(secretContent);
  });

  it('Can create folder', () => {
    const folderTitle = 'folder1';
    let hashedTitle;
    return this.secretin.addFolder(folderTitle)
      .then(() => {
        let id = -1;
        Object.keys(this.secretin.currentUser.metadatas).forEach((mHashedTitle, i) => {
          if (this.secretin.currentUser.metadatas[mHashedTitle].title === folderTitle) {
            id = i;
          }
        });
        hashedTitle = Object.keys(this.secretin.currentUser.metadatas)[id];
        delete this.secretin.currentUser.metadatas[hashedTitle].id;
        return this.secretin.currentUser.metadatas[hashedTitle];
      })
      .should.eventually.deep.equal({
        lastModifiedAt: '2016-01-01T00:00:00.000Z',
        lastModifiedBy: 'user1',
        users: {
          user1: {
            username: 'user1',
            rights: 2,
          },
        },
        folders: {},
        title: 'folder1',
        type: 'folder',
      })
      .then(() => this.secretin.getSecret(hashedTitle))
      .should.eventually.deep.equal({});
  });

  it('Can disconnect', () => {
    this.secretin.currentUser.disconnect();
    this.secretin.currentUser.should.not.have.any.keys(
      'username',
      'keys',
      'metadatas',
      'token',
      'publicKey',
      'privateKey'
    );
  });

  it('Can change its password', () => {
    const newPassword = 'newPassword';
    return this.secretin.changePassword(newPassword)
      .then(() => {
        this.secretin.currentUser.disconnect();
        return this.secretin.loginUser(username, newPassword);
      })
      .should.eventually.have.all.keys(
        'username',
        'keys',
        'metadatas',
        'token',
        'publicKey',
        'privateKey'
      )
      .then((currentUser) => currentUser.privateKey)
      .should.eventually.be.instanceOf(CryptoKey);
  });

  it('Can get secret', () => {
    const secretHashedTitle = 'f62c937bdaf1ae0efab60a275e0f9080c79511095569e06d431423e1ac971772';
    return this.secretin.getSecret(secretHashedTitle)
      .should.eventually.deep.equal({
        fields: [{
          label: 'a',
          content: 'b',
        }],
      });
  });

  it('Can edit secret', () => {
    const secretHashedTitle = 'f62c937bdaf1ae0efab60a275e0f9080c79511095569e06d431423e1ac971772';
    const secretContent = 'YOLO';
    return this.secretin.editSecret(secretHashedTitle, secretContent)
      .then(() => this.secretin.getSecret(secretHashedTitle))
      .should.eventually.deep.equal(secretContent);
  });

  it('Can add secret to folder', () => {
    const secretHashedTitle = 'f62c937bdaf1ae0efab60a275e0f9080c79511095569e06d431423e1ac971772';
    const folderHashedTitle = '0839fb4655ea32255f60e4e37fe07e207be65774d8a9255bc9344403faeaead7';
    return this.secretin.addSecretToFolder(secretHashedTitle, folderHashedTitle)
      .then(() => this.secretin.currentUser.metadatas[secretHashedTitle])
      .should.eventually.deep.equal({
        lastModifiedAt: '2016-01-01T00:00:00.000Z',
        lastModifiedBy: 'user1',
        users: {
          user1: {
            username: 'user1',
            rights: 2,
            folder: 'folder',
          },
        },
        folders: {
          '0839fb4655ea32255f60e4e37fe07e207be65774d8a9255bc9344403faeaead7': {
            name: 'folder',
          },
        },
        title: 'secret',
        type: 'secret',
        id: 'f62c937bdaf1ae0efab60a275e0f9080c79511095569e06d431423e1ac971772',
      })
      .then(() => this.secretin.getSecret(folderHashedTitle))
      .should.eventually.deep.equal({
        fe40e52d903d821e696d366aa9c9e383de2c1486b90166f458eb99788660f545: 1,
        f62c937bdaf1ae0efab60a275e0f9080c79511095569e06d431423e1ac971772: 1,
      });
  });

  it('Can remove secret from folder', () => {
    const secretHashedTitle = 'fe40e52d903d821e696d366aa9c9e383de2c1486b90166f458eb99788660f545';
    const folderHashedTitle = '0839fb4655ea32255f60e4e37fe07e207be65774d8a9255bc9344403faeaead7';
    return this.secretin.removeSecretFromFolder(secretHashedTitle, folderHashedTitle)
      .then(() => this.secretin.currentUser.metadatas[secretHashedTitle])
      .should.eventually.deep.equal({
        lastModifiedAt: '2016-01-01T00:00:00.000Z',
        lastModifiedBy: 'user1',
        users: {
          user1: {
            username: 'user1',
            rights: 2,
          },
        },
        folders: {},
        title: 'secret in folder',
        type: 'secret',
        id: 'fe40e52d903d821e696d366aa9c9e383de2c1486b90166f458eb99788660f545',
      })
      .then(() => this.secretin.getSecret(folderHashedTitle))
      .should.eventually.deep.equal({});
  });

  it('Can delete secret', () => {
    const secretHashedTitle = 'f62c937bdaf1ae0efab60a275e0f9080c79511095569e06d431423e1ac971772';
    return this.secretin.deleteSecret(secretHashedTitle)
      .then(() => this.secretin.currentUser.metadatas)
      .should.eventually.deep.equal({
        '0839fb4655ea32255f60e4e37fe07e207be65774d8a9255bc9344403faeaead7': {
          folders: {},
          id: '0839fb4655ea32255f60e4e37fe07e207be65774d8a9255bc9344403faeaead7',
          lastModifiedAt: '2016-09-17T23:41:33.936Z',
          lastModifiedBy: 'user1',
          title: 'folder',
          type: 'folder',
          users: {
            user1: {
              username: 'user1',
              rights: 2,
            },
          },
        },
        fe40e52d903d821e696d366aa9c9e383de2c1486b90166f458eb99788660f545: {
          users: {
            user1: {
              username: 'user1',
              rights: 2,
              folder: 'folder',
            },
          },
          lastModifiedAt: '2016-09-17T23:41:33.897Z',
          lastModifiedBy: 'user1',
          folders: {
            '0839fb4655ea32255f60e4e37fe07e207be65774d8a9255bc9344403faeaead7': {
              name: 'folder',
            },
          },
          title: 'secret in folder',
          type: 'secret',
          id: 'fe40e52d903d821e696d366aa9c9e383de2c1486b90166f458eb99788660f545',
        },
      });
  });

  it('Can delete secret in a folder', () => {
    const secretHashedTitle = 'fe40e52d903d821e696d366aa9c9e383de2c1486b90166f458eb99788660f545';
    const folderHashedTitle = '0839fb4655ea32255f60e4e37fe07e207be65774d8a9255bc9344403faeaead7';
    return this.secretin.deleteSecret(secretHashedTitle)
      .then(() => this.secretin.currentUser.metadatas)
      .should.eventually.deep.equal({
        f62c937bdaf1ae0efab60a275e0f9080c79511095569e06d431423e1ac971772: {
          folders: {},
          id: 'f62c937bdaf1ae0efab60a275e0f9080c79511095569e06d431423e1ac971772',
          lastModifiedAt: '2016-09-17T23:41:23.071Z',
          lastModifiedBy: 'user1',
          title: 'secret',
          type: 'secret',
          users: {
            user1: {
              username: 'user1',
              rights: 2,
            },
          },
        },
        '0839fb4655ea32255f60e4e37fe07e207be65774d8a9255bc9344403faeaead7': {
          folders: {},
          id: '0839fb4655ea32255f60e4e37fe07e207be65774d8a9255bc9344403faeaead7',
          lastModifiedAt: '2016-01-01T00:00:00.000Z',
          lastModifiedBy: 'user1',
          title: 'folder',
          type: 'folder',
          users: {
            user1: {
              username: 'user1',
              rights: 2,
            },
          },
        },
      })
      .then(() => this.secretin.getSecret(folderHashedTitle))
      .should.eventually.deep.equal({});
  });
});
