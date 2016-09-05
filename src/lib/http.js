function reqData(path, datas, type) {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open(type, encodeURI(path));
    xhr.setRequestHeader('Content-Type', 'application/json');
    xhr.onload = () => {
      if (xhr.status === 200) {
        resolve(xhr.statusText);
      } else {
        try {
          const newData = JSON.parse(xhr.responseText);
          reject({ status: xhr.statusText, datas: newData });
        } catch (e) {
          reject(xhr.statusText);
        }
      }
    };
    xhr.send(JSON.stringify(datas));
  });
}

export function GET(path) {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('GET', encodeURI(path));
    xhr.onload = () => {
      if (xhr.status === 200) {
        const datas = JSON.parse(xhr.responseText);
        resolve(datas);
      } else {
        reject(xhr.statusText);
      }
    };
    xhr.send();
  });
}

export function POST(path, datas) {
  return reqData(path, datas, 'POST');
}

export function PUT(path, datas) {
  return reqData(path, datas, 'PUT');
}

export function DELETE(path, datas) {
  return reqData(path, datas, 'DELETE');
}
