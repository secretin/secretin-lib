import json from '@rollup/plugin-json';
import eslint from '@rollup/plugin-eslint';

export default {
  input: 'src/index.js',
  plugins: [eslint(), json()],
  output: [
    { file: 'dist/secretin.js', format: 'iife', name: 'Secretin' },
    { file: 'dist/secretin.umd.js', name: 'Secretin', format: 'umd' },
  ],
};
