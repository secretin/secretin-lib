# 2.5.4

* Secret content is now UTF-8 encoded before encryption. Characters above
  U+00FF (bullet •, ™, Cyrillic, emoji, ...) were silently truncated to a single
  byte, which could turn them into `"` and make `JSON.parse` fail after
  decryption. Decryption tries UTF-8 first and falls back to the legacy
  one-byte-per-char decoding, so existing secrets stay readable. Secrets that
  were already corrupted on save cannot be repaired and must be re-entered.

* Login no longer fails when the metadata cache cannot be decrypted or parsed:
  the cache is rebuilt from the per-secret metadatas instead.

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