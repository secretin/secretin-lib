describe('Random utils', () => {
  beforeEach(() => {
    // eslint-disable-next-line
    randomnessSeed = 1337;
  });

  it('Utils.generateRandomNumber is working', () => {
    Secretin.Utils.generateRandomNumber(10).should.equal(7);
  });

  it('Utils.generateSeed is working', () => {
    const waitedSeed = {
      b32: 'HE4TSOJZHE4TSOJZHE4TSOJZHE4TSOJZHE4TSOJZHE4TSOJZHE4Q',
      raw: new Uint8Array(32).fill(57),
    };
    Secretin.Utils.generateSeed().should.deep.equal(waitedSeed);
  });
});
