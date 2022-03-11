describe('Not logged user', () => {
  const username = 'user';
  const password = 'password';
  const wrongUsername = 'wrongUser';
  const wrongPassword = 'wrongPassword';

  beforeEach(async () => {
    localStorage.clear();
    // eslint-disable-next-line
    availableKeyCounter = 0;
    // eslint-disable-next-line
    await resetAndGetDB();
  });

  afterEach(() => {
    this.secretin.currentUser.disconnect();
  });

  it('Can create user', async () => {
    const user = await this.secretin.newUser(username, password);
    user.should.have.all.keys(
      'totp',
      'username',
      'publicKey',
      'publicKeySign',
      'privateKey',
      'privateKeySign',
      'keys',
      'hash',
      'metadatas',
      'options',
      'cryptoAdapter'
    );
    user.privateKey.should.be.instanceOf(CryptoKey);
  });

  it('Can login', async () => {
    await this.secretin.newUser(username, password);
    this.secretin.currentUser.disconnect();
    const user = await this.secretin.loginUser(username, password);
    user.should.have.all.keys(
      'totp',
      'username',
      'publicKey',
      'publicKeySign',
      'privateKey',
      'privateKeySign',
      'keys',
      'hash',
      'metadatas',
      'options',
      'cryptoAdapter'
    );
    user.privateKey.should.be.instanceOf(CryptoKey);
  });

  it("Can't login with invalid password", async () => {
    await this.secretin.newUser(username, password);
    this.secretin.currentUser.disconnect();
    let error;
    try {
      await this.secretin.loginUser(username, wrongPassword);
    } catch (e) {
      error = e;
    }
    console.log(error);
    error.should.be.instanceOf(Secretin.Errors.InvalidPasswordError);
    // eslint-disable-next-line no-undef,no-unused-expressions
    chai.expect(this.secretin.currentUser.privateKey).to.equal(null);
  });

  it("Can't login with invalid username", async () => {
    await this.secretin.newUser(wrongUsername, password);
    this.secretin.currentUser.disconnect();
    let error;
    try {
      await this.secretin.loginUser(username, wrongPassword);
    } catch (e) {
      error = e;
    }
    console.log(error);
    error.should.be.instanceOf(Secretin.Errors.UserNotFoundError);
    // eslint-disable-next-line no-undef,no-unused-expressions
    chai.expect(this.secretin.currentUser.privateKey).to.equal(undefined);
  });

  it("Can't create user with existing username", async () => {
    await this.secretin.newUser(username, password);
    this.secretin.currentUser.disconnect();
    let error;
    try {
      await this.secretin.newUser(username, password);
    } catch (e) {
      error = e;
    }
    error.should.be.instanceOf(Secretin.Errors.UsernameAlreadyExistsError);
    // eslint-disable-next-line no-undef,no-unused-expressions
    chai.expect(this.secretin.currentUser.privateKey).to.equal(null);
  });
});
