import { dirname } from 'path';
import { env } from 'gulp-util';

const pathToThisFile = __dirname;
const root = dirname(pathToThisFile);
const dist = root + '/dist/';
const tmp = root + '/tmp';
const require = root + '/distRequired';
const src = root + '/src';
const distDev = root + '/distDev';
const app = env.app
	? tmp + '/apps/' + env.app + '/'
	: 'null';

module.exports = {
	app,
	dist,
	distDev,
	require,
	src,
	tmp
};
