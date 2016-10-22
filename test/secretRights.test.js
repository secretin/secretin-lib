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
    );

    it('Should be able to write', () => {
      const secretContent = 'YOLO';
      return this.secretin.loginUser('user2', 'user2')
        .then(() => this.secretin.editSecret(secretHashedTitle, secretContent))
        .then(() => this.secretin.getSecret(secretHashedTitle))
        .should.eventually.deep.equal(secretContent);
    });

    it('Should not be able to share', () =>
      this.secretin.loginUser('user2', 'user2')
        .then(() => this.secretin.shareSecret(secretHashedTitle, 'user4', 'secret', 0))
        .should.be.rejectedWith(`You can't share secret ${secretHashedTitle}`)
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
    );

    it('Should be able to write', () => {
      const secretContent = 'YOLO';
      return this.secretin.loginUser('user3', 'user3')
        .then(() => this.secretin.editSecret(secretHashedTitle, secretContent))
        .then(() => this.secretin.getSecret(secretHashedTitle))
        .should.eventually.deep.equal(secretContent);
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
    );
  });
});
