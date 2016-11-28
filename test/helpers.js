// eslint-disable-next-line
function resetAndGetDB() {
  if (__karma__.config.args[0] === 'server') {
    let server = 'http://127.0.0.1:3000';
    if (__karma__.config.args[1]) {
      server = __karma__.config.args[1];
    }
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open('GET', `${server}/reset`);
      xhr.onload = () => {
        if (xhr.status === 200) {
          this.secretin = new Secretin(Secretin.API.Server, server);
          resolve();
        } else {
          reject(xhr.statusText);
        }
      };
      xhr.send();
    });
  }
  return new Promise((resolve) => {
    this.secretin = new Secretin();
    resolve();
  });
}
