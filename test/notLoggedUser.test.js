describe("New user", function() {
  beforeEach(function() {
      window.secretin = new Secretin();
  });
  it("Should have username", function(done) {
    var username = 'username';
    var password = 'password';
    secretin.newUser(username, password).then(function(){
      expect(secretin.currentUser.username).toBe('username');
      done();
    });
  });

  it("Should have no metadatas", function(done) {
    var username = 'username';
    var password = 'password';
    secretin.newUser(username, password).then(function(){
      expect(secretin.currentUser.metadatas).toEqual({});
      done();
    });
  });
});