describe('Not logged user', () => {
  const username = 'username';
  const password = 'password';

  beforeEach(() => {
    this.secretin = new Secretin();
  });

  it('Can create user', () =>
    this.secretin.newUser(username, password)
      .should.eventually.have.all.keys(
        'username',
        'keys',
        'metadatas',
        'token',
        'publicKey',
        'privateKey'
      )
      .then((currentUser) => currentUser.privateKey)
      .should.eventually.be.instanceOf(CryptoKey)
  );

  it('Can login', () =>
    this.secretin.newUser(username, password)
      .then((currentUser) => {
        currentUser.disconnect();
        return this.secretin.loginUser(username, password);
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
      .should.eventually.be.instanceOf(CryptoKey)
  );

  it('Can\'t login with invalid password', () =>
    this.secretin.newUser(username, password)
      .then((currentUser) => {
        currentUser.disconnect();
        return this.secretin.loginUser(username, 'wrongPassword');
      })
      .should.be.rejectedWith('Invalid Password')
  );

  it('Can\'t create user with existing username', () =>
    this.secretin.newUser(username, password)
      .then((currentUser) => {
        currentUser.disconnect();
        return this.secretin.newUser(username, 'otherPassword');
      })
      .should.be.rejectedWith('Username already exists')
  );
});
