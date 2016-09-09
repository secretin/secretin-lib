/* eslint-disable import/no-extraneous-dependencies */
import json from 'rollup-plugin-json';
import babel from 'rollup-plugin-babel';
import eslint from 'rollup-plugin-eslint';

export default {
  entry: 'src/index.js',
  format: 'iife',
  moduleName: 'Secretin',
  plugins: [eslint(), json(), babel()],
  dest: 'dist/secretin.js',
};
