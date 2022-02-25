module.exports = {
  env: {
    browser: true,
    es2021: true,
    mocha: true,
  },
  extends: ['airbnb-base', 'prettier', 'plugin:security/recommended'],
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
  },
  rules: {
    'prettier/prettier': 'error',
  },
  globals: {
    Secretin: true,
    __karma__: true,
    SecretinBrowserAdapter: true,
  },
  plugins: ['import', 'prettier', 'mocha', 'security'],
};
