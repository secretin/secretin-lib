if (__karma__.config.args[0] === 'server') {
  describe('Sync offline/online', () => {
    const username = 'user';
    const password = 'password';

    it('Can work offline', () =>
      // eslint-disable-next-line
      resetAndGetDB()
        .then(() => this.secretin.newUser(username, password))
        .then(() => this.secretin.getDb())
        .then(() => {
          this.secretin.currentUser.disconnect();
          this.secretin = new Secretin(SecretinBrowserAdapter, Secretin.API.Server, 'http://doesntexist.secret-in.me');
          return this.secretin.loginUser(username, password);
        })
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
        .then((currentUser) => currentUser.privateKey)
        .should.eventually.be.instanceOf(CryptoKey)
        .then(() => typeof this.secretin.api.db)
        .should.eventually.be.equal('object')
    );
  });
}
