/* eslint-disable import/no-extraneous-dependencies */
import json from 'rollup-plugin-json';
import babel from 'rollup-plugin-babel';
import eslint from 'rollup-plugin-eslint';

export default {
  entry: 'src/index.js',
  moduleName: 'Secretin',
  plugins: [eslint(), json(), babel()],
  targets: [
    { dest: 'dist/secretin.js', format: 'iife' },
    { dest: 'dist/secretin.umd.js', format: 'umd' },
  ],
};
