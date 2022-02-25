/* eslint-disable import/no-extraneous-dependencies */
import json from '@rollup/plugin-json';
import eslint from '@rollup/plugin-eslint';

export default {
  input: 'src/adapters/browser/index.js',
  plugins: [eslint(), json()],
  output: [
    {
      file: 'dist/adapters/browser.js',
      format: 'iife',
      name: 'SecretinBrowserAdapter',
    },
    {
      file: 'dist/adapters/browser.umd.js',
      format: 'umd',
      name: 'SecretinBrowserAdapter',
    },
  ],
};
