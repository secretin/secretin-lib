/* eslint-disable no-undef */

describe('randomNumber', () => {
  it('Must return a number >= 0', () => {
    expect(this.secretin.generateRandomNumber(10)).to.be.at.least(0);
  });
  it('Must return a number <= max param', () => {
    expect(this.secretin.generateRandomNumber(10)).to.be.at.most(10);
  });
});
