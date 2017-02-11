function reqData(path, datas, type) {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.timeout = 5750;
    xhr.open(type, encodeURI(path));
    xhr.setRequestHeader('Content-Type', 'application/json');
    xhr.onload = () => {
      const newData = JSON.parse(xhr.responseText);
      if (xhr.status === 200) {
        resolve(newData.reason ? newData.reason : newData);
      } else {
        reject(newData.reason);
      }
    };
    xhr.ontimeout = () => {
      reject('Offline');
    };
    xhr.onerror = () => {
      reject('Offline');
    };
    xhr.send(JSON.stringify(datas));
  });
}

export function doGET(path) {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.timeout = 5750;
    xhr.open('GET', encodeURI(path));
    xhr.onload = () => {
      const datas = JSON.parse(xhr.responseText);
      if (xhr.status === 200) {
        resolve(datas);
      } else {
        reject(datas.reason);
      }
    };
    xhr.ontimeout = () => {
      reject('Offline');
    };
    xhr.onerror = () => {
      reject('Offline');
    };
    xhr.send();
  });
}

export function doPOST(path, datas) {
  return reqData(path, datas, 'POST');
}

export function doPUT(path, datas) {
  return reqData(path, datas, 'PUT');
}

export function doDELETE(path, datas) {
  return reqData(path, datas, 'DELETE');
}
