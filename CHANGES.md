# Changes with nginx 2.2.1

* dev toolchain upgrade (including bundling toolchain)

* Crypto adapters should be imported from umd

Before 2.2.1

```javascript
import { SecretinBrowserAdapter } from 'secretin/dist/adapters/browser';
```

Now

```javascript
import SecretinBrowserAdapter from 'secretin/dist/adapters/browser.umd';
```