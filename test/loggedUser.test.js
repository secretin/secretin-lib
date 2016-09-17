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
      '6e4c4c3bb1db78ae7aaeb9a478f52fe072001219e4fe5739b4e78f0e921bc1aa': {
        folders: {},
        id: '6e4c4c3bb1db78ae7aaeb9a478f52fe072001219e4fe5739b4e78f0e921bc1aa',
        title: 'secret',
        type: 'secret',
        users: {
          user1: {
            rights: 2,
          },
        },
      },
      af3205b139eece726bffdf893a13680936e23b6562f166de63ae87277faaed4e: {
        folders: {},
        id: 'af3205b139eece726bffdf893a13680936e23b6562f166de63ae87277faaed4e',
        title: 'folder',
        type: 'folder',
        users: {
          user1: {
            rights: 2,
          },
        },
      },
      b28ff23056e101129f355472d7ed4d191d51bb5e59ad4f904ba992062726f8ac: {
        users: {
          user1: {
            rights: 2,
            folder: 'folder',
          },
        },
        folders: {
          af3205b139eece726bffdf893a13680936e23b6562f166de63ae87277faaed4e: {
            name: 'folder',
          },
        },
        title: 'secret in folder',
        type: 'secret',
        id: 'b28ff23056e101129f355472d7ed4d191d51bb5e59ad4f904ba992062726f8ac',
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
        users: {
          user1: {
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
        users: {
          user1: {
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
    const secretHashedTitle = '6e4c4c3bb1db78ae7aaeb9a478f52fe072001219e4fe5739b4e78f0e921bc1aa';
    return this.secretin.getSecret(secretHashedTitle)
      .should.eventually.deep.equal({
        fields: [{
          label: 'a',
          content: 'b',
        }],
      });
  });

  it('Can edit secret', () => {
    const secretHashedTitle = '6e4c4c3bb1db78ae7aaeb9a478f52fe072001219e4fe5739b4e78f0e921bc1aa';
    const secretContent = 'YOLO';
    return this.secretin.editSecret(secretHashedTitle, secretContent)
      .then(() => this.secretin.getSecret(secretHashedTitle))
      .should.eventually.deep.equal(secretContent);
  });

  it('Can add secret to folder', () => {
    const secretHashedTitle = '6e4c4c3bb1db78ae7aaeb9a478f52fe072001219e4fe5739b4e78f0e921bc1aa';
    const folderHashedTitle = 'af3205b139eece726bffdf893a13680936e23b6562f166de63ae87277faaed4e';
    return this.secretin.addSecretToFolder(secretHashedTitle, folderHashedTitle)
      .then(() => this.secretin.currentUser.metadatas[secretHashedTitle])
      .should.eventually.deep.equal({
        users: {
          user1: {
            rights: 2,
            folder: 'folder',
          },
        },
        folders: {
          af3205b139eece726bffdf893a13680936e23b6562f166de63ae87277faaed4e: {
            name: 'folder',
          },
        },
        title: 'secret',
        type: 'secret',
        id: '6e4c4c3bb1db78ae7aaeb9a478f52fe072001219e4fe5739b4e78f0e921bc1aa',
      })
      .then(() => this.secretin.getSecret(folderHashedTitle))
      .should.eventually.deep.equal({
        b28ff23056e101129f355472d7ed4d191d51bb5e59ad4f904ba992062726f8ac: 1,
        '6e4c4c3bb1db78ae7aaeb9a478f52fe072001219e4fe5739b4e78f0e921bc1aa': 1,
      });
  });

  it('Can remove secret from folder', () => {
    const secretHashedTitle = 'b28ff23056e101129f355472d7ed4d191d51bb5e59ad4f904ba992062726f8ac';
    const folderHashedTitle = 'af3205b139eece726bffdf893a13680936e23b6562f166de63ae87277faaed4e';
    return this.secretin.removeSecretFromFolder(secretHashedTitle, folderHashedTitle)
      .then(() => this.secretin.currentUser.metadatas[secretHashedTitle])
      .should.eventually.deep.equal({
        users: {
          user1: {
            rights: 2,
          },
        },
        folders: {},
        title: 'secret in folder',
        type: 'secret',
        id: 'b28ff23056e101129f355472d7ed4d191d51bb5e59ad4f904ba992062726f8ac',
      })
      .then(() => this.secretin.getSecret(folderHashedTitle))
      .should.eventually.deep.equal({});
  });

  it('Can delete secret', () => {
    const secretHashedTitle = '6e4c4c3bb1db78ae7aaeb9a478f52fe072001219e4fe5739b4e78f0e921bc1aa';
    return this.secretin.deleteSecret(secretHashedTitle)
      .then(() => this.secretin.currentUser.metadatas)
      .should.eventually.deep.equal({
        af3205b139eece726bffdf893a13680936e23b6562f166de63ae87277faaed4e: {
          folders: {},
          id: 'af3205b139eece726bffdf893a13680936e23b6562f166de63ae87277faaed4e',
          title: 'folder',
          type: 'folder',
          users: {
            user1: {
              rights: 2,
            },
          },
        },
        b28ff23056e101129f355472d7ed4d191d51bb5e59ad4f904ba992062726f8ac: {
          users: {
            user1: {
              rights: 2,
              folder: 'folder',
            },
          },
          folders: {
            af3205b139eece726bffdf893a13680936e23b6562f166de63ae87277faaed4e: {
              name: 'folder',
            },
          },
          title: 'secret in folder',
          type: 'secret',
          id: 'b28ff23056e101129f355472d7ed4d191d51bb5e59ad4f904ba992062726f8ac',
        },
      });
  });

  it('Can delete secret in a folder', () => {
    const secretHashedTitle = 'b28ff23056e101129f355472d7ed4d191d51bb5e59ad4f904ba992062726f8ac';
    const folderHashedTitle = 'af3205b139eece726bffdf893a13680936e23b6562f166de63ae87277faaed4e';
    return this.secretin.deleteSecret(secretHashedTitle)
      .then(() => this.secretin.currentUser.metadatas)
      .should.eventually.deep.equal({
        '6e4c4c3bb1db78ae7aaeb9a478f52fe072001219e4fe5739b4e78f0e921bc1aa': {
          folders: {},
          id: '6e4c4c3bb1db78ae7aaeb9a478f52fe072001219e4fe5739b4e78f0e921bc1aa',
          title: 'secret',
          type: 'secret',
          users: {
            user1: {
              rights: 2,
            },
          },
        },
        af3205b139eece726bffdf893a13680936e23b6562f166de63ae87277faaed4e: {
          folders: {},
          id: 'af3205b139eece726bffdf893a13680936e23b6562f166de63ae87277faaed4e',
          title: 'folder',
          type: 'folder',
          users: {
            user1: {
              rights: 2,
            },
          },
        },
      })
      .then(() => this.secretin.getSecret(folderHashedTitle))
      .should.eventually.deep.equal({});
  });
});
