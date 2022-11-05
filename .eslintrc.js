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
    'security/detect-object-injection': 'off',
    'no-return-await': 'off',
    'no-await-in-loop': 'off',
    'no-restricted-syntax': 'off',
    'prefer-destructuring': 'off',
    'prettier/prettier': 'error',
  },
  globals: {
    Secretin: true,
    __karma__: true,
    SecretinBrowserAdapter: true,
    expect: true,
  },
  plugins: ['import', 'prettier', 'mocha', 'security'],
};
