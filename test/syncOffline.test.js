if (__karma__.config.args[0] === 'server') {
  window.process = 'karma';
  describe('Sync offline/online', () => {
    const username = 'user';
    const password = 'passwOrd123!';
    const username2 = 'user2';
    const password2 = 'passwOrd123!2';

    const secretTitle = 'secret';
    let secretId = '';

    const now = '2016-01-01T00:00:00.000Z';
    // eslint-disable-next-line no-extend-native
    Date.prototype.toISOString = () => now;

    const secretContent = {
      fields: [
        {
          label: 'a',
          content: 'b',
        },
      ],
    };

    const newSecretTitle = 'newSecret';
    const newSecretContent = {
      fields: [
        {
          label: 'c',
          content: 'd',
        },
      ],
    };

    const newSecretContent2 = {
      fields: [
        {
          label: 'e',
          content: 'f',
        },
      ],
    };

    const newSecretContent3 = {
      fields: [
        {
          label: 'g',
          content: 'h',
        },
      ],
    };

    beforeEach(async () => {
      localStorage.clear();
      // eslint-disable-next-line
      availableKeyCounter = 0;
      // eslint-disable-next-line
      await resetAndGetDB()
      await this.secretin.newUser(username, password);
      secretId = await this.secretin.addSecret(secretTitle, secretContent);
      await this.secretin.newUser(username2, password2);
    });

    async function syncThenOffline() {
      await this.secretin.loginUser(username, password);
      this.secretin.currentUser.disconnect();
      this.secretin = new Secretin(
        SecretinBrowserAdapter,
        Secretin.API.Server,
        'http://doesntexist.secret-in.me'
      );
      return await this.secretin.loginUser(username, password);
    }

    async function goBackOnline() {
      this.secretin.currentUser.disconnect();
      // eslint-disable-next-line
      this.secretin = await getDB();
      return await this.secretin.loginUser(username, password);
    }

    it('Can work offline', async () => {
      const user = await syncThenOffline();
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
      const dbType = typeof this.secretin.api.db;
      dbType.should.be.equal('object');
    });

    it('Can retrieve options', async () => {
      await syncThenOffline();
      this.secretin.currentUser.options.should.deep.equal({
        timeToClose: 30,
      });
    });

    it("Can't edit options", async () => {
      await syncThenOffline();
      let error;
      try {
        await this.secretin.editOptions({
          timeToClose: 60,
        });
      } catch (e) {
        error = e;
      }
      error.should.be.instanceOf(Secretin.Errors.OfflineError);
    });

    it('Can create secret', async () => {
      await syncThenOffline();
      await this.secretin.addSecret(newSecretTitle, newSecretContent);
      await goBackOnline();

      let id = -1;
      Object.keys(this.secretin.currentUser.metadatas).forEach(
        (mHashedTitle, i) => {
          if (
            this.secretin.currentUser.metadatas[mHashedTitle].title ===
            newSecretTitle
          ) {
            id = i;
          }
        }
      );
      const hashedTitle = Object.keys(this.secretin.currentUser.metadatas)[id];
      delete this.secretin.currentUser.metadatas[hashedTitle].id;
      this.secretin.currentUser.metadatas[hashedTitle].should.deep.equal({
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
      });
      const secret = await this.secretin.getSecret(hashedTitle);
      secret.should.deep.equal(newSecretContent);
    });

    it('Can edit secret', async () => {
      await syncThenOffline();
      await this.secretin.editSecret(secretId, newSecretContent);
      await goBackOnline();
      const secret = await this.secretin.getSecret(secretId);
      secret.should.deep.equal(newSecretContent);
    });

    it('Can rename secret', async () => {
      await syncThenOffline();
      await this.secretin.renameSecret(secretId, newSecretTitle);
      await goBackOnline();
      this.secretin.currentUser.metadatas[secretId].title.should.deep.equal(
        newSecretTitle
      );
    });

    it('Edit "deleted secret" create conflict', async () => {
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
      await syncThenOffline();

      delete window.process;
      // eslint-disable-next-line
          this.secretin2 = getDB();
      await this.secretin2.loginUser(username, password);

      await this.secretin2.deleteSecret(secretId);

      this.secretin2.currentUser.disconnect();
      window.process = 'karma';
      await this.secretin.editSecret(secretId, newSecretContent);

      await this.secretin.editSecret(secretId, newSecretContent2);
      await goBackOnline();

      const id = Object.keys(this.secretin.currentUser.metadatas)[0];
      delete this.secretin.currentUser.metadatas[id].id;
      this.secretin.currentUser.metadatas[id].should.deep.equal(
        expectedMetadatas
      );
      Object.keys(this.secretin.currentUser.metadatas).length.should.equal(1);
    });

    it('Edit "edited secret" create conflict', async () => {
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

      let conflictId;

      await syncThenOffline();

      delete window.process;
      // eslint-disable-next-line
      this.secretin2 = await getDB();
      await this.secretin2.loginUser(username, password);
      await this.secretin2.editSecret(secretId, newSecretContent);

      this.secretin2.currentUser.disconnect();
      window.process = 'karma';
      await this.secretin.editSecret(secretId, newSecretContent2);

      await this.secretin.editSecret(secretId, newSecretContent3);
      await goBackOnline();
      Object.keys(this.secretin.currentUser.metadatas).length.should.equal(2);

      Object.keys(this.secretin.currentUser.metadatas).forEach((key) => {
        if (
          this.secretin.currentUser.metadatas[key].title.indexOf('Conflict')
        ) {
          conflictId = key;
        }
      });
      delete this.secretin.currentUser.metadatas[conflictId].id;
      this.secretin.currentUser.metadatas[conflictId].should.deep.equal(
        expectedMetadatas
      );
      const secret = await this.secretin.getSecret(conflictId);
      secret.should.deep.equal(newSecretContent3);
      const secret2 = await this.secretin.getSecret(secretId);
      secret2.should.deep.equal(newSecretContent);

      const conflictSecretsStr = localStorage.getItem(
        `${Secretin.Utils.SecretinPrefix}conflictSecrets${username}`
      );
      const conflictSecrets = conflictSecretsStr
        ? JSON.parse(conflictSecretsStr)
        : {};
      Object.keys(conflictSecrets)[0].should.deep.equal(secretId);
    });
  });
}
