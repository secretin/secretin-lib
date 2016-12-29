# Secretin
![Jacques Secrétin](http://www.echo62.com/images/sportif/sportif48.jpg)

Open source secret manager with groups management based on WebCryptoAPI http://www.w3.org/TR/WebCryptoAPI/

**No dependencies**, only "vanilla" JS

This repository contains the library that holds the logic for secrets management.

* For the default client implementation (web), see https://github.com/secretin/secretin-app
* For the windows native app, see https://github.com/secretin/secretin-windows
* For the default server implementation, see https://github.com/secretin/secretin-server

# Install

npm package is not released yet. In the meanwhile you need to build the lib manually (see below).

## Build and test
```
yarn install
yarn test
```
You'll need chrome to test the WebCryptoAPI with karma (https://karma-runner.github.io/).

To test with the server part you should set `API_TYPE` environment variable to `server` and `SERVER_URI` to the server base uri (default is http://127.0.0.1:3000)

`API_TYPE=server SERVER_URI=http://test.secret-in.me:3000 npm test`

Server should be in test mode (check README of https://github.com/secretin/secretin-server) to respond to `/reset` route.

# How it works
## Introduction
Secretin first aim is to remove any centralized obscure point.
* You can read the whole source code
* No monster libraries included (jQuery I'm looking at you)
* No server confidentiality needs
* Crypto implementation is delegated to WebCryptoAPI

The only thing you are forced to trust is your browser (and I hope you do because it's difficult to do without). We hope http://www.w3.org/TR/WebCryptoAPI/ is well designed in your modern browser and are not responsible for bad cryptography implementation (as we are not crypto experts at all)

Another problem Secretin is trying to handle is secrets sharing.

We try to provide maximum anonymity. We want database leakage to be a feature, so data must no be usable without your keys (not even metadata like username or secret title).
## Details
This part tries to explain how Secretin works under the hood.

First of all, you need to choose a username and a master password.

When you create a new account, username is SHA256'ed and a RSA-OAEP key pair is generated (according to http://www.w3.org/TR/WebCryptoAPI/#algorithm-overview array, RSA-OAEP seems to be the only assymetric algorithm that supports encrypt and decrypt methods).

Then, your private key is wrapped with AES-CBC-256 and a derivedKey from your master password.
The derivedKey uses PBKDF2 with SHA-256, 256 bits random salt and 100 000 + (random%255) iterations.

When you create a secret, you specify a title and a secret content.

The title is salted with the timestamp, and then SHA256'd to serve as an ID.

The secret is encrypted using AES-GCM-256 with randomly generated intermediate key.

Finally, this intermediate key is wrapped with your public key and linked with the hashed title.

Another layer of authentication is added on server side. The derived key is SHA256'd and sent to the server, which compares the SHA256 of it with the hash it saved when you created your account.

This way the key is hard to bruteforce, doesn't travel in cleartext and are not known by the server.

Any time you want to access a secret, you need to type your master password, that will decrypt your private key, that will decrypt the intermediate key that will finally decrypt the secret.

Using this method, it's easy to share a secret. You need to know the exact username of your friend so you can find his public key to encrypt the intermediate key of the secret.

Another field named metadatas is encrypted with the same intermediate key and contains the title and the list of users who can access the secret.

Every metadatas fields are decrypted after login to be able to generate the list of secret.

The secret field is only decrypted when you try to access the secret.

The "unshare" feature modifies the intermediate key, so it also needs to decrypt the secret to reencrypt it with the new intermediate key.

In server-saved mode, every authenticated request is signed to prove that the user has the right to do the action. It uses the same RSA key with PSS algorithm verified server-side using forge library.

## API
Secretin object has `api` and `currentUser` attributes.

Constructor takes API type and API content. It actually could be `APIStandalone` or `APIServer`.

In standalone mode, the second argument is the json database and can be empty.
In server mode, the second argument is server url (default would be `window.location.origin`)

`currentUser` is an empty object by default.

* *changeDB* allows current secretin object to change its DB source.
* *newUser* takes `username` and `password` and tries to create a new user with a new RSA key.
* *loginUser* takes `username`, `password` and optional `totp` token. It will return the user informations (RSA key, secret metadatas, private options, list of secret id).
* *refreshUser* get user informations using RSA-PSS signature.
* *addFolder* create a folder. Actually a shorthand for addSecret with `type` parameter to `folder`.
* *addSecret* takes `title`, `content` and optional `type` parameter to create a new secret (`content` will pass through `JSON.stringify`).
* *changePassword* takes `newPassword` parameter and changes password for `currentUser`.
* *editSecret* takes `secretId` and `newContent` and edits the corresponding secret.
* *editOptions* takes `newOptions` and edits the `currentUser` options.
* *addSecretToFolder* takes `secretId` and `folderId` and links the secret to the folder.
* *removeSecretFromFolder* takes `secretId` and `folderId` and unlinks the secret from this folder.
* *shareSecret* takes `secretId`, `friendName` and `rights` and shares the secret to the corresponding user with defined rights (ReadOnly, ReadWrite, ReadWriteShare). If `secretId` is a folder, it recursively shares any child secret.
* *unshareSecret* takes `secretId`, `friendName` and unshares the secret to the corresponding user. It deletes the intermediate key and reshares a new one with every other user. If `secretId` is a folder, it revursively unshares any child secret. (Note that this operation can take some time).
* *renewKey* takes `secretId`, generates a new key and reshares it with every authorized user.
* *getSecret* takes `secretId` and returns the decrypted corresponding secret.
* *deleteSecret* takes `secretId` and deletes this secret. If `secretId` is a folder, deletes every child secret.
* *activateTotp* takes `seed` and activates double authentication based on google authenticator TOTP.
* *deactivateTotp* de-activates double authentication based on google authenticator TOTP.
* *activateShortLogin* takes `shortPass` and `deviceName` and activates double authentication based on the device.
* *deactivateShortLogin* de-activates double authentication based on the device.
* *shortLogin* takes `shortPass` and returns user information if done from same device as `activateShortpass`.
* *canITryShortLogin* checks if double authentication based on device is possible.
