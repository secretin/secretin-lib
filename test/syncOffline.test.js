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

    const newSecretContent2 = {
      fields: [{
        label: 'e',
        content: 'f',
      }],
    };

    const newSecretContent3 = {
      fields: [{
        label: 'g',
        content: 'h',
      }],
    };

    const conflictSecretsKey = `${Secretin.prefix}conflictSecrets${username}`;
    const cacheActionsKey = `${Secretin.prefix}cacheActions_${username}`;

    beforeEach(() => {
      localStorage.removeItem(cacheActionsKey);
      localStorage.removeItem(conflictSecretsKey);
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

    it('Edit "deleted secret" create conflict', () => {
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
          delete window.process;
          // eslint-disable-next-line
          this.secretin2 = getDB();
          return this.secretin2.loginUser(username, password);
        })
        .then(() => this.secretin2.deleteSecret(secretId))
        .then(() => {
          this.secretin2.currentUser.disconnect();
          window.process = 'karma';
          return this.secretin.editSecret(secretId, newSecretContent)
        })
        .then(() => this.secretin.editSecret(secretId, newSecretContent2))
        .then(() => goBackOnline())
        .then(() => {
          const id = Object.keys(this.secretin.currentUser.metadatas)[0];
          delete this.secretin.currentUser.metadatas[id].id;
          return this.secretin.currentUser.metadatas[id];
        })
        .should.eventually.deep.equal(expectedMetadatas)
        .then(() => Object.keys(this.secretin.currentUser.metadatas).length)
        .should.eventually.equal(1);
    });


    it('Edit "edited secret" create conflict', () => {
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

      let conflictSecrets;
      let conflictId;

      return syncThenOffline()
        .then(() => {
          delete window.process;
          // eslint-disable-next-line
          this.secretin2 = getDB();
          return this.secretin2.loginUser(username, password);
        })
        .then(() => this.secretin2.editSecret(secretId, newSecretContent))
        .then(() => {
          this.secretin2.currentUser.disconnect();
          window.process = 'karma';
          return this.secretin.editSecret(secretId, newSecretContent2)
        })
        .then(() => this.secretin.editSecret(secretId, newSecretContent3))
        .then(() => goBackOnline())
        .then(() => Object.keys(this.secretin.currentUser.metadatas).length)
        .should.eventually.equal(2)
        .then(() => {
          Object.keys(this.secretin.currentUser.metadatas).forEach(key => {
            if(this.secretin.currentUser.metadatas[key].title.indexOf('Conflict')) {
              conflictId = key;
            }
          })
          delete this.secretin.currentUser.metadatas[conflictId].id;
          return this.secretin.currentUser.metadatas[conflictId];
        })
        .should.eventually.deep.equal(expectedMetadatas)
        .then(() => this.secretin.getSecret(conflictId))
        .should.eventually.deep.equal(newSecretContent3)
        .then(() => this.secretin.getSecret(secretId))
        .should.eventually.deep.equal(newSecretContent)
        .then(() => {
          const conflictSecretsStr = localStorage.getItem(conflictSecretsKey);
          conflictSecrets = conflictSecretsStr
            ? JSON.parse(conflictSecretsStr)
            : {};
          return Object.keys(conflictSecrets)[0]
        })
        .should.eventually.deep.equal(secretId)
    });

  });
}
