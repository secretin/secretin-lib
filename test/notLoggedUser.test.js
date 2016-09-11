describe('New user', () => {
  const username = 'username';
  const password = 'password';

  beforeEach(() => {
    this.secretin = new Secretin();
  });

  it('Should have username', () =>
    this.secretin.newUser(username, password)
      .then((currentUser) => currentUser.username)
      .should.eventually.equal(username)
  );

  it('Should have no metadatas', () =>
    this.secretin.newUser(username, password)
      .then((currentUser) => currentUser.metadatas)
      .should.eventually.deep.equal({})
  );

  it('Can login', () =>
    this.secretin.newUser(username, password)
      .then((currentUser) => {
        currentUser.disconnect();
        return this.secretin.loginUser(username, password);
      })
      .then((currentUser) => currentUser.username)
      .should.eventually.equal(username)
  );

  it('Can\'t login with invalid password', () =>
    this.secretin.newUser(username, password)
      .then((currentUser) => {
        currentUser.disconnect();
        return this.secretin.loginUser(username, 'wrongPassword');
      })
      .should.be.rejectedWith('Invalid Password')
  );
});
