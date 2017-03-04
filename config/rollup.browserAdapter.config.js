/* eslint-disable import/no-extraneous-dependencies */
import json from 'rollup-plugin-json';
import babel from 'rollup-plugin-babel';
import eslint from 'rollup-plugin-eslint';

export default {
  entry: 'src/adapters/browser/index.js',
  moduleName: 'SecretinBrowserAdapter',
  plugins: [eslint(), json(), babel()],
  targets: [
    { dest: 'dist/adapters/browser.js', format: 'iife' },
    { dest: 'dist/adapters/browser.js', format: 'umd' },
  ],
};
