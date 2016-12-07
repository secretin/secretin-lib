import { version } from '../package.json';

import Secretin from './Secretin';
import User from './User';
import APIStandalone from './API/Standalone';
import APIServer from './API/Server';
import Errors from './Errors';

import { generateSeed } from './lib/util.js';

Secretin.version = version;
Secretin.User = User;
Secretin.generateSeed = generateSeed;
Secretin.API = {
  Standalone: APIStandalone,
  Server: APIServer,
};

Secretin.Errors = Errors;

export default Secretin;
