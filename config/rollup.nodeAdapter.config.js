/* eslint-disable import/no-extraneous-dependencies */
import json from 'rollup-plugin-json';
import babel from 'rollup-plugin-babel';
import eslint from 'rollup-plugin-eslint';

export default {
  entry: 'src/adapters/node/index.js',
  moduleName: 'SecretinNodeAdapter',
  plugins: [eslint(), json(), babel()],
  targets: [
    { dest: 'dist/adapters/node.js', format: 'iife' },
    { dest: 'dist/adapters/node.umd.js', format: 'umd' },
  ],
  globals: {
    crypto: 'crypto',
    forge: 'node-forge',
  },
  external: ['node-forge', 'crypto'],
};
