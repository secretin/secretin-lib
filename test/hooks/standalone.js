// eslint-disable-next-line
function resetAndGetDB() {
  return new Promise((resolve) => {
    this.secretin = new Secretin();
    resolve();
  });
}