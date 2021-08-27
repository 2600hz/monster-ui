import { dirname, join } from 'upath';
import { env } from './helpers/helpers.js';

const pathToThisFile = dirname(__filename);
const root = dirname(pathToThisFile);
const cache = join(root, '.gulp-cache');
const dist = join(root, 'dist');
const distDev = join(root, 'distDev');
const require = join(root, 'distRequired');
const src = join(root, 'src');
const tmp = join(root, 'tmp');
const app = env.app ? join(tmp, 'apps', env.app) : '';

export {
	app,
	cache,
	dist,
	distDev,
	require,
	src,
	tmp
};
