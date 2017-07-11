describe('Not logged user', () => {
  const username = 'user';
  const password = 'password';
  const wrongUsername = 'wrongUser';
  const wrongPassword = 'wrongPassword';

  beforeEach(() => {
    localStorage.clear();
    // eslint-disable-next-line
    availableKeyCounter = 0;
    // eslint-disable-next-line
    return resetAndGetDB();
  });

  afterEach(() => {
    this.secretin.currentUser.disconnect();
  });

  it('Can create user', () =>
    this.secretin
      .newUser(username, password)
      .should.eventually.have.all.keys(
        'totp',
        'username',
        'publicKey',
        'publicKeySign',
        'privateKey',
        'privateKeySign',
        'keys',
        'hash',
        'metadatas',
        'options'
      )
      .then(currentUser => currentUser.privateKey)
      .should.eventually.be.instanceOf(CryptoKey));

  it('Can login', () =>
    this.secretin
      .newUser(username, password)
      .then(() => this.secretin.currentUser.disconnect())
      .then(() => this.secretin.loginUser(username, password))
      .should.eventually.have.all.keys(
        'totp',
        'username',
        'publicKey',
        'publicKeySign',
        'privateKey',
        'privateKeySign',
        'keys',
        'hash',
        'metadatas',
        'options'
      )
      .then(currentUser => currentUser.privateKey)
      .should.eventually.be.instanceOf(CryptoKey));

  it("Can't login with invalid password", () =>
    this.secretin
      .newUser(username, password)
      .then(() => this.secretin.currentUser.disconnect())
      .then(() => this.secretin.loginUser(username, wrongPassword))
      .should.be.rejectedWith(Secretin.Errors.InvalidPasswordError)
      .then(
        () => this.secretin.currentUser.privateKey
      ).should.eventually.be.null);

  it("Can't login with invalid username", () =>
    this.secretin
      .newUser(wrongUsername, password)
      .then(() => this.secretin.currentUser.disconnect())
      .then(() => this.secretin.loginUser(username, wrongPassword))
      .should.be.rejectedWith(Secretin.Errors.UserNotFoundError)
      .then(
        () => this.secretin.currentUser.privateKey
      ).should.eventually.be.undefined);

  it("Can't create user with existing username", () =>
    this.secretin
      .newUser(username, password)
      .then(() => this.secretin.currentUser.disconnect())
      .then(() => this.secretin.newUser(username, password))
      .should.be.rejectedWith(Secretin.Errors.UsernameAlreadyExistsError)
      .then(
        () => this.secretin.currentUser.privateKey
      ).should.eventually.be.null);
});
