function getDB() {
  if (__karma__.config.args[0] === 'server') {
    let server = 'http://127.0.0.1:3000';
    if (__karma__.config.args[1]) {
      server = __karma__.config.args[1];
    }
    return new Secretin(SecretinBrowserAdapter, Secretin.API.Server, server);
  }
  return new Secretin(SecretinBrowserAdapter);
}
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
          this.secretin = getDB();
          resolve();
        } else {
          reject(xhr.statusText);
        }
      };
      xhr.send();
    });
  }
  return new Promise(resolve => {
    this.secretin = getDB();
    // console.log(JSON.stringify(this.secretin));
    resolve();
  });
}
