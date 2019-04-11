import { join } from 'upath';
import { dirname } from 'path';
import { env } from './helpers/helpers.js';

const pathToThisFile = dirname(__filename);
const root = dirname(pathToThisFile);
const dist = join(root, 'dist');
const distDev = join(root, 'distDev');
const require = join(root, 'distRequired');
const src = join(root, 'src');
const tmp = join(root, 'tmp');
const app = env.app ? join(tmp, 'apps', env.app) : '';

export {
	app,
	dist,
	distDev,
	require,
	src,
	tmp
};
