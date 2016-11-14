// eslint-disable-next-line
function resetAndGetDB() {
  const server = 'http://127.0.0.1:3000';
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
