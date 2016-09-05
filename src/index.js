import { version } from '../package.json';

import Secretin from './Secretin';
import User from './User';
import Secret from './Secret';
import APIStandalone from './API/Standalone';
import APIServer from './API/Server';

Secretin.version = version;
Secretin.User = User;
Secretin.Secret = Secret;
Secretin.API = {
  Standalone: APIStandalone,
  Server: APIServer,
};

export default Secretin;
