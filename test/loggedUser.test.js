describe('User', () => {
  beforeEach((done) => {
    window.secretin = new Secretin();
    var username = 'user1';
    var password = 'password';
    secretin.newUser(username, password).then(() => {
      done();
    });
  });

  it ('Can create secret', (done) => {
    secretin.addSecret('secret1', 'This is secret').then(() => {
      var hashedSecret = Object.keys(secretin.currentUser.metadatas)[0];
      expect(secretin.currentUser.metadatas[hashedSecret]).toEqual({
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

  it ('Can create folder', (done) => {
    secretin.addFolder('folder1').then(() => {
      var hashedSecret = Object.keys(secretin.currentUser.metadatas)[0];
      expect(secretin.currentUser.metadatas[hashedSecret]).toEqual({
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