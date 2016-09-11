describe('User', () => {
  const username = 'user1';
  const password = 'password';

  beforeEach(() => {
    this.secretin = new Secretin();
    return this.secretin.newUser(username, password);
  });

  it('Can create secret', () =>
    this.secretin.addSecret('secret1', 'This is secret')
      .then(() => {
        const hashedSecret = Object.keys(this.secretin.currentUser.metadatas)[0];
        return this.secretin.currentUser.metadatas[hashedSecret];
      })
      .should.eventually.deep.equal({
        users: {
          user1: {
            rights: 2,
          },
        },
        folders: {},
        title: 'secret1',
        type: 'secret',
      })
  );

  it('Can create folder', () =>
    this.secretin.addFolder('folder1', 'This is secret')
      .then(() => {
        const hashedSecret = Object.keys(this.secretin.currentUser.metadatas)[0];
        return this.secretin.currentUser.metadatas[hashedSecret];
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
    );
});
