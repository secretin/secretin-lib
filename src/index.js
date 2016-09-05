import { version } from '../package.json';

import Secretin from './Secretin';
import User from './User';
import Secret from './Secret';

Secretin.version = version;
Secretin.User = User;
Secretin.Secret = Secret;

export default Secretin;
