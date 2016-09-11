describe('New user', () => {
  const username = 'username';
  const password = 'password';

  beforeEach(() => {
    this.secretin = new Secretin();
  });

  it('Should have username', (done) => {
    this.secretin.newUser(username, password).then(() => {
      expect(this.secretin.currentUser.username).toBe('username');
      done();
    });
  });

  it('Should have no metadatas', (done) => {
    this.secretin.newUser(username, password).then(() => {
      expect(this.secretin.currentUser.metadatas).toEqual({});
      done();
    });
  });
});
