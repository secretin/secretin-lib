import { version } from '../package.json';

import Secretin from './Secretin';
import User from './User';
import APIStandalone from './API/Standalone';
import APIServer from './API/Server';
import Errors from './Errors';
import Statuses from './Statuses';

import Utils from './lib/utils';

Secretin.version = version;
Secretin.User = User;
Secretin.API = {
  Standalone: APIStandalone,
  Server: APIServer,
};

Secretin.Errors = Errors;
Secretin.Statuses = Statuses;
Secretin.Utils = Utils;

export default Secretin;
