if (__karma__.config.args[0] === 'server') {
  window.process = 'karma';
  describe('Sync offline/online', () => {
    const username = 'user';
    const password = 'password';
    const username2 = 'user2';
    const password2 = 'password2';

    const secretTitle = 'secret';
    let secretId = '';

    const now = '2016-01-01T00:00:00.000Z';

    const secretContent = {
      fields: [{
        label: 'a',
        content: 'b',
      }],
    };

    const newSecretTitle = 'newSecret';
    const newSecretContent = {
      fields: [{
        label: 'c',
        content: 'd',
      }],
    };

    beforeEach(() => {
      const cacheActionsKey = `${Secretin.prefix}cacheActions_${username}`;
      localStorage.removeItem(cacheActionsKey);
      // eslint-disable-next-line
      availableKeyCounter = 0;
      // eslint-disable-next-line
      return resetAndGetDB()
        .then(() => this.secretin.newUser(username, password))
        .then(() => this.secretin.addSecret(secretTitle, secretContent))
        .then((hashedTitle) => {
          secretId = hashedTitle;
        })
        .then(() => this.secretin.newUser(username2, password2))
      });

    function syncThenOffline(){
      return this.secretin.loginUser(username, password)
        .then(() => {
          this.secretin.currentUser.disconnect();
          this.secretin = new Secretin(Secretin.API.Server, 'http://doesntexist.secret-in.me');
          return this.secretin.loginUser(username, password);
        })
    }

    function goBackOnline(){
      this.secretin.currentUser.disconnect();
      // eslint-disable-next-line
      this.secretin = getDB();
      return this.secretin.loginUser(username, password);
    }

    it('Can work offline', () =>
      syncThenOffline()
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

    it('Can retrieve options', () =>
        syncThenOffline()
        .then(() =>
          this.secretin.currentUser.options.should.deep.equal({
            timeToClose: 30,
          })
        )
    );

    it('Can\'t edit options', () =>
      syncThenOffline()
        .then(() => this.secretin.editOptions({
          timeToClose: 60,
        }))
        .should.be.rejectedWith(Secretin.Errors.OfflineError)
    );

    it('Can create secret', () => {
      let hashedTitle;
      return syncThenOffline()
        .then(() => this.secretin.addSecret(newSecretTitle, newSecretContent))
        .then(() => goBackOnline())
        .then(() => {
          let id = -1;
          Object.keys(this.secretin.currentUser.metadatas).forEach((mHashedTitle, i) => {
            if (this.secretin.currentUser.metadatas[mHashedTitle].title === newSecretTitle) {
              id = i;
            }
          });
          hashedTitle = Object.keys(this.secretin.currentUser.metadatas)[id];
          delete this.secretin.currentUser.metadatas[hashedTitle].id;
          return this.secretin.currentUser.metadatas[hashedTitle];
        })
        .should.eventually.deep.equal({
          lastModifiedAt: now,
          lastModifiedBy: username,
          users: {
            [username]: {
              username,
              rights: 2,
              folders: { ROOT: true },
            },
          },
          title: newSecretTitle,
          type: 'secret',
        })
        .then(() => this.secretin.getSecret(hashedTitle))
        .should.eventually.deep.equal(newSecretContent);
    });

    it('Can edit secret', () =>
      syncThenOffline()
        .then(() => this.secretin.editSecret(secretId, newSecretContent))
        .then(() => goBackOnline())
        .then(() => this.secretin.getSecret(secretId))
        .should.eventually.deep.equal(newSecretContent)
    );

    it('Can\'t edit deleted secret', () => {
      const expectedMetadatas = {
        lastModifiedAt: now,
        lastModifiedBy: username,
        title: `${secretTitle} (Conflict)`,
        type: 'secret',
        users: {
          [username]: {
            username,
            rights: 2,
            folders: { ROOT: true },
          },
        },
      };
      return syncThenOffline()
        .then(() => {
          // eslint-disable-next-line
          this.secretin2 = getDB();
          return this.secretin2.loginUser(username, password);
        })
        .then(() => this.secretin2.deleteSecret(secretId))
        .then(() => this.secretin.editSecret(secretId, newSecretContent))
        .then(() => goBackOnline())
        .then(() => {
          const id = Object.keys(this.secretin.currentUser.metadatas)[0];
          delete this.secretin.currentUser.metadatas[id].id;
          return this.secretin.currentUser.metadatas[id];
        })
        .should.eventually.deep.equal(expectedMetadatas)
    }
    );

  });
}
