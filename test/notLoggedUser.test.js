describe('Not logged user', () => {
  const username = 'user';
  const password = 'password';
  const wrongPassword = 'wrongPassword';

  // eslint-disable-next-line
  before(() => resetAndGetDB());

  afterEach(() => {
    this.secretin.currentUser.disconnect();
  });

  it('Can create user', () =>
    this.secretin.newUser(username, password)
      .should.eventually.have.all.keys(
        'totp',
        'hash',
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
    this.secretin.loginUser(username, password)
      .should.eventually.have.all.keys(
        'totp',
        'username',
        'publicKey',
        'privateKey',
        'keys',
        'hash',
        'metadatas',
        'token'
      )
      .then((currentUser) => currentUser.privateKey)
      .should.eventually.be.instanceOf(CryptoKey)
  );

  it('Can\'t login with invalid password', () =>
    this.secretin.loginUser(username, wrongPassword)
      .should.be.rejectedWith('Invalid Password')
      .then(() => this.secretin.currentUser.privateKey)
      .should.eventually.be.null
  );

  it('Can\'t create user with existing username', () =>
    this.secretin.newUser(username, password)
      .should.be.rejectedWith('Username already exists')
      .then(() => this.secretin.currentUser.privateKey)
      .should.eventually.be.null
  );
});
