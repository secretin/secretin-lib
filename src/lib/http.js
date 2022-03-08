import { OfflineError } from '../Errors';

function reqData(path, datas, type, timeout = 10000) {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    if (typeof window.process !== 'undefined') {
      // Electron
      xhr.timeout = timeout;
    }
    // eslint-disable-next-line security/detect-non-literal-fs-filename
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
      reject(new OfflineError());
    };
    xhr.onerror = () => {
      reject(new OfflineError());
    };
    xhr.send(JSON.stringify(datas));
  });
}

export function doGET(path, timeout = 6000) {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    if (typeof window.process !== 'undefined') {
      // Electron
      xhr.timeout = timeout;
    }
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
      reject(new OfflineError());
    };
    xhr.onerror = () => {
      reject(new OfflineError());
    };
    xhr.send();
  });
}

export function doPOST(path, datas, timeout = 10000) {
  return reqData(path, datas, 'POST', timeout);
}

export function doPUT(path, datas, timeout = 10000) {
  return reqData(path, datas, 'PUT', timeout);
}

export function doDELETE(path, datas, timeout = 10000) {
  return reqData(path, datas, 'DELETE', timeout);
}
