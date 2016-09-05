/* eslint-disable import/no-extraneous-dependencies */
import json from 'rollup-plugin-json';
import babel from 'rollup-plugin-babel';

export default {
  entry: 'src/index.js',
  format: 'iife',
  moduleName: 'Secretin',
  plugins: [json(), babel()],
  dest: 'dist/secretin.js',
};
