/* eslint-disable */

crypto = require('crypto');
forge = require('node-forge');
should = require('chai').should();
chai = require('chai');

const testInput = require('../test_input');

const Node_fixtures = require('../fixtures/node.js');
const Browser_fixtures = require('../fixtures/browser.js');

const SecretinNodeAdapter = require('../../dist/adapters/node.umd');

testInput('Node', SecretinNodeAdapter, 'node', Node_fixtures);
testInput('Node', SecretinNodeAdapter, 'browser', Browser_fixtures);
