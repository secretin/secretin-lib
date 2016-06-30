
function uiSharedUsers(userHash){
  var elem = document.createElement('li');
  elem.classList.add('sharedUserElem');

  var userHashSpan = document.createElement('span');
  userHashSpan.textContent = userHash;

  var unshareBtn = document.createElement('input');
  unshareBtn.type = 'button';
  unshareBtn.value = 'Unshare';
  unshareBtn.addEventListener('click', unshare);

  elem.appendChild(userHashSpan);
  elem.appendChild(unshareBtn);
  return elem;
}

function uiSecret(hashedTitle, title){
  var elem = document.createElement('li');
  elem.classList.add('secretElem');

  var btn = document.createElement('input');
  btn.type = 'button';
  btn.value = 'Show';
  btn.addEventListener('click', show);

  var shareBtn = document.createElement('input');
  shareBtn.type = 'button';
  shareBtn.value = 'Share';
  shareBtn.addEventListener('click', share);

  var editBtn = document.createElement('input');
  editBtn.type = 'button';
  editBtn.value = 'Edit';
  editBtn.addEventListener('click', editSecret);

  var deleteBtn = document.createElement('input');
  deleteBtn.type = 'button';
  deleteBtn.value = 'Delete';
  deleteBtn.addEventListener('click', deleteSecret);

  var titleSpan = document.createElement('span');
  titleSpan.textContent = title.substring(14);

  var br = document.createElement('br');

  var hashSpan = document.createElement('span');
  hashSpan.textContent = hashedTitle;
  hashSpan.style.display = 'none';

  elem.appendChild(hashSpan);
  elem.appendChild(titleSpan);
  elem.appendChild(br);
  elem.appendChild(btn);

  if(currentUser.keys[hashedTitle].rights > 0){
    elem.appendChild(editBtn);
  }
  if(currentUser.keys[hashedTitle].rights > 1){
    elem.appendChild(shareBtn);
  }
  elem.appendChild(deleteBtn);

  return elem;
}
