describe('Logged user', () => {
  const username = 'user1';
  const password = 'password';

  beforeEach(() => {
    this.secretin = new Secretin();
    return this.secretin.newUser(username, password);
  });

  it('Can create secret', () => {
    const secretContent = 'This is secret';
    const secretTitle = 'secret1';
    let hashedTitle;
    return this.secretin.addSecret(secretTitle, secretContent)
      .then(() => {
        hashedTitle = Object.keys(this.secretin.currentUser.metadatas)[0];
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
      .should.eventually.equal(JSON.stringify(secretContent));
  });

  it('Can create folder', () => {
    const folderTitle = 'folder1';
    let hashedTitle;
    return this.secretin.addFolder(folderTitle)
      .then(() => {
        hashedTitle = Object.keys(this.secretin.currentUser.metadatas)[0];
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
      .should.eventually.equal(JSON.stringify({}));
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
});
