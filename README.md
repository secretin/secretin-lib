# secretin
![Jacques Secrétin](http://www.echo62.com/images/sportif/sportif48.jpg)

Open source secret manager with groups managment based on webapi crypto http://www.w3.org/TR/WebCryptoAPI/

**No dependencies**, only "vanilla" JS

Exists in two versions :
* Standalone (you have to copy paste your json DB) (`new Secretin();`)
* Server saved (a server save your encrypted DB) (`new Secretin(Secretin.API.Server, serverURI);`)

# Install
## Standalone
You can download server/client/secretinAlone.tar.gz (https://www.secret-in.me/secretinAlone.tar.gz)
```
wget https://www.secret-in.me/secretinAlone.tar.gz
tar xvzf secretinAlone.tar.gz
cd alone
google-chrome index.html
```

## Specific pre logon windows hooking
WIP
Step to install is not written yet but here is the result :

![](http://i.imgur.com/HK6Nqpi.gif)

## Server saved
Use https://github.com/secretin/secretin-server

Then use https://github.com/secretin/secretin-app which embed this lib.

## Build and test
```
npm install
npm test
```
You'll need chrome to test the webcryptoAPI with karma (https://karma-runner.github.io/).

To test with the server part you should set `API_TYPE` environment variable to `server` and `SERVER_URI` to the server base uri (default is http://127.0.0.1:3000)

`API_TYPE=server SERVER_URI=http://test.secret-in.me:3000 npm test`

Server should be in test mode (check README of https://github.com/secretin/secretin-server) to respond to `/reset` route.

# How it works
## Introduction
Secret-in first aim is to remove any centralised obscur point.
* You can read the whole source code
* No monster libraries included (Jquery I'm looking at you)
* No server confidentiality needs
* Crypto is not part of this code

The only thing you are forced to trust is your browser (and I hope you do because it's difficult to do without). We hope http://www.w3.org/TR/WebCryptoAPI/ is well designed in your modern browser and are not responsible for bad cryptography implementation (as we are not crypto expert at all)

Another point secret-in is trying to handle is secrets sharing.

The whole things try to respect maximum anonymity. We want database leakage to be a feature so no datas should be usable without your keys (not even metadata like username or secret title).
## Details
This part try to explain the whole operation behind secret-in.

First, you need username and master password.

When you create a new account, username is SHA256'ed and a RSA-OAEP key pair is generated (according to http://www.w3.org/TR/WebCryptoAPI/#algorithm-overview array, RSA-OAEP seems to be the only assymetric algorithm that support encrypt and decrypt method)

Then your private key is wrapped with AES-CBC-256 and a derivedKey from your master password.

The derivedKey use PBKDF2 with SHA-256, 256 bits random salt and 100 000 + (random%255) iterations.

When you create a secret, you give a title and a secret content.

The title is salted with the timestamp then SHA256'ed to serve as an ID.

The secret is encrypted using AES-GCM-256 with randomly generated intermediate key.

Finally, this intermediate key is wrapped with your public key and linked with the hashed title.

Another layer of authentication is added on server side. The derived key is SHA256'ed and sent to the server that compare the SHA256 of it with the hash it saved when you created your account.

This way the key is hard to BF, doesn't travel in clear on the wires and are not known by the server.

Any time you want to access a secret, you need to type your master password that would decrypt your private key that would decrypt the intermediate key that would decrypt the secret.

Using this, it's easy to share secret. You need to know the exact username of your friend so you can find his public key to encrypt the intermediate key of the secret.

Another field (named metadatas) is encrypted with the same intermediate key and contains the title and the list of users which can access the secret.

Every metadatas fields are decrypted after login to be able to generate the list of secret.

Secret field is only decrypted when you try to access the secret (`unshare` modify the intermediate key so it also needs to decrypt the secret to reencrypt it with the new intermediate key).

In server saved mode every authenticated requests are signed to prove user has rights to do the action. It uses the same RSA key with PSS algorithm verified server side using forge library.

## "API"
Secretin object has `api` and `currentUser` attribute.

Constructor take API type and API content. It actually could be `APIStandalone` or `APIServer`.

In the first case, second arguments is json database and can be empty. In server mode, second arguments is server url (default would be `window.location.origin`)

`currentUser` is an empty object by default.

* *changeDB* allow current secretin object to change his DB source.
* *newUser* takes `username` and `password` and would try to create a new user with new RSA key.
* *loginUser* takes `username`, `password` and optional `totp` token. It will get back the user informations (RSA key, secret metadatas, private options, list of secret id).
* *refreshUser* get back user informations using RSA-PSS signature.
* *addFolder* create folder calling addSecret with `isFolder` parameter to `true`.
* *addSecret* takes `title`, `content` and optional `isFolder` parameter to create new secret (`content` will pass to `JSON.stringify`).
* *changePassword* takes `newPassword` parameter and change password for `currentUser`.
* *editSecret* takes `secretId` and `newContent` and edit the corresponding secret.
* *editOptions* takes `newOptions` and edit the `currentUser` options.
* *addSecretToFolder* takes `secretId` and `folderId` and link the secret to the folder.
* *removeSecretFromFolder* takes `secretId` and `folderId` and unlink the secret from this folder.
* *shareSecret* takes `secretId`, `friendName` and `rights` and share the secret to the corresponding user with defined rights (ReadOnly, ReadWrite, ReadWriteShare). If `secretId` is a folder, it recursively shares every child secret.
* *unshareSecret* takes `secretId`, `friendName` and unshare the secret to the corresponding user. It delete the intermediate key and reshare a new one with every other user. If `secretId` is a folder, it revursively unshare every child secret. (Note this operation can take time).
* *renewKey* takes `secretId`, generate a new key and reshare it with every authorized user.
* *getSecret* takes `secretId` and return the decrypted corresponding secret.
* *deleteSecret* takes `secretId` and delete this secret. If `secretId` is a folder, delete every child secret.
* *activateTotp* takes `seed` and activate double authentication based on google authenticator TOTP.
* *activateShortpass* takes `shortPass` and `deviceName` and activate double authentication based on the device.
* *shortLogin* takes `shortPass` and get back user information if done from same device as `activateShortpass`.
* *canITryShortpass* check if double authentication based on device is possible.