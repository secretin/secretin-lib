describe('User', () => {
  beforeEach((done) => {
    this.secretin = new Secretin();
    const username = 'user1';
    const password = 'password';
    this.secretin.newUser(username, password).then(() => {
      done();
    });
  });

  it('Can create secret', (done) => {
    this.secretin.addSecret('secret1', 'This is secret').then(() => {
      const hashedSecret = Object.keys(this.secretin.currentUser.metadatas)[0];
      expect(this.secretin.currentUser.metadatas[hashedSecret]).toEqual({
        users: {
          user1: {
            rights: 2,
          },
        },
        folders: {},
        title: 'secret1',
      });
      done();
    });
  });

  it('Can create folder', (done) => {
    this.secretin.addFolder('folder1').then(() => {
      const hashedSecret = Object.keys(this.secretin.currentUser.metadatas)[0];
      expect(this.secretin.currentUser.metadatas[hashedSecret]).toEqual({
        users: {
          user1: {
            rights: 2,
          },
        },
        folders: {},
        title: 'folder1',
        type: 'folder',
      });
      done();
    });
  });
});
