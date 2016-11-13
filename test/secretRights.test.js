// eslint-disable-next-line
Date.prototype.toISOString = () => '2016-01-01T00:00:00.000Z';

describe('Secret accesses', () => {
  const secretHashedTitle = '0865ee7f1c509351be2b6c218dc7b323d79988b75b53fd115bb02ef7e4d64466';
  // db3 => /fixtures/loggedUserDB.js

  beforeEach(() => {
    this.secretin = new Secretin();
    // eslint-disable-next-line
    const newDB = JSON.parse(JSON.stringify(db3));
    this.secretin.changeDB(newDB);
  });

  describe('No access user', () => {
    it('Should not be able to read', () =>
      this.secretin.loginUser('user4', 'user4')
        .then(() => this.secretin.getSecret(secretHashedTitle))
        .should.be.rejectedWith('You don\'t have this secret')
    );

    it('Should not be able to write', () =>
      this.secretin.loginUser('user4', 'user4')
        .then(() => this.secretin.editSecret(secretHashedTitle, 'YOLO'))
        .should.be.rejectedWith('You don\'t have this secret')
    );

    it('Should not be able to share', () =>
      this.secretin.loginUser('user4', 'user4')
        .then(() => this.secretin.shareSecret(secretHashedTitle, 'user1', 'secret', 0))
        .should.be.rejectedWith('You don\'t have this secret')
    );

    it('Should not be able to unshare', () =>
      this.secretin.loginUser('user4', 'user4')
        .then(() => this.secretin.unshareSecret(secretHashedTitle, 'user1'))
        .should.be.rejectedWith('You don\'t have this secret')
    );
  });

  describe('Read only user', () => {
    it('Should be able to read', () =>
      this.secretin.loginUser('user1', 'user1')
        .then(() => this.secretin.getSecret(secretHashedTitle))
        .should.eventually.deep.equal({
          fields: [{
            label: 'a',
            content: 'b',
          }],
        })
        .then(() => this.secretin.currentUser.metadatas[secretHashedTitle])
        .should.eventually.deep.equal({
          lastModifiedAt: '2016-10-21T21:59:56.478Z',
          lastModifiedBy: 'user',
          users: {
            user: {
              username: 'user',
              rights: 2,
            },
            user1: {
              username: 'user1',
              rights: 0,
            },
            user2: {
              username: 'user2',
              rights: 1,
            },
            user3: {
              username: 'user3',
              rights: 2,
            },
          },
          folders: {},
          title: 'secret',
          type: 'secret',
          id: secretHashedTitle,
        })
    );

    it('Should not be able to write', () =>
      this.secretin.loginUser('user1', 'user1')
        .then(() => this.secretin.editSecret(secretHashedTitle, 'YOLO'))
        .should.be.rejectedWith('You can\'t edit this secret')
    );

    it('Should not be able to share', () =>
      this.secretin.loginUser('user1', 'user1')
        .then(() => this.secretin.shareSecret(secretHashedTitle, 'user4', 'secret', 0))
        .should.be.rejectedWith(`You can't share secret ${secretHashedTitle}`)
    );

    it('Should not be able to unshare', () =>
      this.secretin.loginUser('user1', 'user1')
        .then(() => this.secretin.unshareSecret(secretHashedTitle, 'user2'))
        .should.be.rejectedWith(`You can\'t unshare secret ${secretHashedTitle}`)
    );
  });

  describe('Read/Write only user', () => {
    it('Should be able to read', () =>
      this.secretin.loginUser('user2', 'user2')
        .then(() => this.secretin.getSecret(secretHashedTitle))
        .should.eventually.deep.equal({
          fields: [{
            label: 'a',
            content: 'b',
          }],
        })
        .then(() => this.secretin.currentUser.metadatas[secretHashedTitle])
        .should.eventually.deep.equal({
          lastModifiedAt: '2016-10-21T21:59:56.478Z',
          lastModifiedBy: 'user',
          users: {
            user: {
              username: 'user',
              rights: 2,
            },
            user1: {
              username: 'user1',
              rights: 0,
            },
            user2: {
              username: 'user2',
              rights: 1,
            },
            user3: {
              username: 'user3',
              rights: 2,
            },
          },
          folders: {},
          title: 'secret',
          type: 'secret',
          id: secretHashedTitle,
        })
    );

    it('Should be able to write', () => {
      const secretContent = 'YOLO';
      return this.secretin.loginUser('user2', 'user2')
        .then(() => this.secretin.editSecret(secretHashedTitle, secretContent))
        .then(() => this.secretin.getSecret(secretHashedTitle))
        .should.eventually.deep.equal(secretContent)
        .then(() => this.secretin.currentUser.metadatas[secretHashedTitle])
        .should.eventually.deep.equal({
          lastModifiedAt: '2016-01-01T00:00:00.000Z',
          lastModifiedBy: 'user2',
          users: {
            user: {
              username: 'user',
              rights: 2,
            },
            user1: {
              username: 'user1',
              rights: 0,
            },
            user2: {
              username: 'user2',
              rights: 1,
            },
            user3: {
              username: 'user3',
              rights: 2,
            },
          },
          folders: {},
          title: 'secret',
          type: 'secret',
          id: secretHashedTitle,
        });
    });

    it('Should not be able to share', () =>
      this.secretin.loginUser('user2', 'user2')
        .then(() => this.secretin.shareSecret(secretHashedTitle, 'user4', 'secret', 0))
        .should.be.rejectedWith(`You can't share secret ${secretHashedTitle}`)
    );

    it('Should not be able to unshare', () =>
      this.secretin.loginUser('user2', 'user2')
        .then(() => this.secretin.unshareSecret(secretHashedTitle, 'user1'))
        .should.be.rejectedWith(`You can\'t unshare secret ${secretHashedTitle}`)
    );
  });

  describe('Read/Write/Share only user', () => {
    it('Should be able to read', () =>
      this.secretin.loginUser('user3', 'user3')
        .then(() => this.secretin.getSecret(secretHashedTitle))
        .should.eventually.deep.equal({
          fields: [{
            label: 'a',
            content: 'b',
          }],
        })
        .then(() => this.secretin.currentUser.metadatas[secretHashedTitle])
        .should.eventually.deep.equal({
          lastModifiedAt: '2016-10-21T21:59:56.478Z',
          lastModifiedBy: 'user',
          users: {
            user: {
              username: 'user',
              rights: 2,
            },
            user1: {
              username: 'user1',
              rights: 0,
            },
            user2: {
              username: 'user2',
              rights: 1,
            },
            user3: {
              username: 'user3',
              rights: 2,
            },
          },
          folders: {},
          title: 'secret',
          type: 'secret',
          id: secretHashedTitle,
        })
    );

    it('Should be able to write', () => {
      const secretContent = 'YOLO';
      return this.secretin.loginUser('user3', 'user3')
        .then(() => this.secretin.editSecret(secretHashedTitle, secretContent))
        .then(() => this.secretin.getSecret(secretHashedTitle))
        .should.eventually.deep.equal(secretContent)
        .then(() => this.secretin.currentUser.metadatas[secretHashedTitle])
        .should.eventually.deep.equal({
          lastModifiedAt: '2016-01-01T00:00:00.000Z',
          lastModifiedBy: 'user3',
          users: {
            user: {
              username: 'user',
              rights: 2,
            },
            user1: {
              username: 'user1',
              rights: 0,
            },
            user2: {
              username: 'user2',
              rights: 1,
            },
            user3: {
              username: 'user3',
              rights: 2,
            },
          },
          folders: {},
          title: 'secret',
          type: 'secret',
          id: secretHashedTitle,
        });
    });

    it('Should be able to share', () =>
      this.secretin.loginUser('user3', 'user3')
        .then(() => this.secretin.shareSecret(secretHashedTitle, 'user4', 'secret', 0))
        .then(() => {
          this.secretin.currentUser.disconnect();
          return this.secretin.loginUser('user4', 'user4');
        })
        .then(() => this.secretin.getSecret(secretHashedTitle))
        .should.eventually.deep.equal({
          fields: [{
            label: 'a',
            content: 'b',
          }],
        })
        .then(() => this.secretin.currentUser.metadatas[secretHashedTitle])
        .should.eventually.deep.equal({
          lastModifiedAt: '2016-01-01T00:00:00.000Z',
          lastModifiedBy: 'user3',
          users: {
            user: {
              username: 'user',
              rights: 2,
            },
            user1: {
              username: 'user1',
              rights: 0,
            },
            user2: {
              username: 'user2',
              rights: 1,
            },
            user3: {
              username: 'user3',
              rights: 2,
            },
            user4: {
              username: 'user4',
              rights: 0,
            },
          },
          folders: {},
          title: 'secret',
          type: 'secret',
          id: secretHashedTitle,
        })
    );

    it('Should be able to unshare', () =>
      this.secretin.loginUser('user3', 'user3')
        .then(() => this.secretin.unshareSecret(secretHashedTitle, 'user1'))
        .then(() => {
          this.secretin.currentUser.disconnect();
          return this.secretin.loginUser('user1', 'user1');
        })
        .then(() => this.secretin.getSecret(secretHashedTitle))
        .should.be.rejectedWith('You don\'t have this secret')
        .then(() => {
          this.secretin.currentUser.disconnect();
          return this.secretin.loginUser('user2', 'user2');
        })
        .then(() => this.secretin.getSecret(secretHashedTitle))
        .should.eventually.deep.equal({
          fields: [{
            label: 'a',
            content: 'b',
          }],
        })
        .then(() => this.secretin.currentUser.metadatas[secretHashedTitle])
        .should.eventually.deep.equal({
          lastModifiedAt: '2016-01-01T00:00:00.000Z',
          lastModifiedBy: 'user3',
          users: {
            user: {
              username: 'user',
              rights: 2,
            },
            user2: {
              username: 'user2',
              rights: 1,
            },
            user3: {
              username: 'user3',
              rights: 2,
            },
          },
          folders: {},
          title: 'secret',
          type: 'secret',
          id: secretHashedTitle,
        })
    );

    it('Should not be able to unshare with itself', () =>
      this.secretin.loginUser('user3', 'user3')
        .then(() => this.secretin.unshareSecret(secretHashedTitle, 'user3'))
        .should.be.rejectedWith('You can\'t unshare with yourself')
    );

    it('Should not be able to share with itself', () =>
      this.secretin.loginUser('user3', 'user3')
        .then(() => this.secretin.shareSecret(secretHashedTitle, 'user3', 'secret', 0))
        .should.be.rejectedWith('You can\'t share with yourself')
    );
  });
});
