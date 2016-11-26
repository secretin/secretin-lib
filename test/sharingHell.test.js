xdescribe('Sharing hell', () => {
  const now = '2016-01-01T00:00:00.000Z';
  // eslint-disable-next-line
  Date.prototype.toISOString = () => now;

  const user1 = 'user1';
  const password1 = 'password1';

  const user2 = 'user2';
  const password2 = 'password2';

  const user3 = 'user3';
  const password3 = 'password3';

  const user4 = 'user4';
  const password4 = 'password4';

  const secret1Title = 'secret1';
  let secret1Id = '';
  const secret1Content = {
    fields: [{
      label: 'a',
      content: 'b',
    }],
  };
  const folder1Title = 'folder1';
  let folder1Id = '';

  beforeEach(() => {
    // eslint-disable-next-line
    availableKeyCounter = 0;
    // eslint-disable-next-line
    return resetAndGetDB()
      .then(() => this.secretin.newUser(user1, password1))
      .then(() => this.secretin.newUser(user2, password2))
      .then(() => this.secretin.newUser(user3, password3))
      .then(() => this.secretin.newUser(user4, password4))
      .then(() => this.secretin.addSecret(secret1Title, secret1Content))
      .then((hashedTitle) => {
        secret1Id = hashedTitle;
        return this.secretin.addFolder(folder1Title);
      })
      .then((hashedTitle) => {
        folder1Id = hashedTitle;
        this.secretin.currentUser.currentFolder = folder1Id;
        return this.secretin.addSecretToFolder(secret1Id, folder1Id);
      })
      .then(() => this.secretin.shareSecret(folder1Id, user1, 'folder', 0))
      .then(() => this.secretin.shareSecret(folder1Id, user2, 'folder', 0))
      .then(() => this.secretin.shareSecret(folder1Id, user3, 'folder', 0))
      .then(() => this.secretin.currentUser.disconnect());
  });

  it('Can yolo', () =>
    this.secretin.login(user4, password4)
      .then(() => this.secretin.unshareSecret(folder1Id, user1))
      .then(() => {
        this.secretin.disconnect();
        return this.secretin.login(user1, password1);
      })
  );
});
