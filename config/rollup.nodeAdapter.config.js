/* eslint-disable import/no-extraneous-dependencies */
import json from '@rollup/plugin-json';
import eslint from '@rollup/plugin-eslint';

export default {
  input: 'src/adapters/node/index.js',
  plugins: [eslint(), json()],
  output: [
    {
      file: 'dist/adapters/node.js',
      format: 'iife',
      name: 'SecretinNodeAdapter',
      globals: {
        crypto: 'crypto',
        forge: 'node-forge',
      },
    },
    {
      file: 'dist/adapters/node.umd.js',
      format: 'umd',
      name: 'SecretinNodeAdapter',
      globals: {
        crypto: 'crypto',
        forge: 'node-forge',
      },
    },
  ],
  external: ['node-forge', 'crypto'],
};
