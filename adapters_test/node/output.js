const fs = require('fs');
const genOutput = require('../gen_output');

const SecretinNodeAdapter = require('../../dist/adapters/node.umd');

genOutput('Node', SecretinNodeAdapter)
  .then((output) => {
    fs.writeFileSync('adapters_test/fixtures/node.js', output);
    console.log('Done !');
  });
