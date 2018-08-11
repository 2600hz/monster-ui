import { dirname } from 'path';
import { env } from 'gulp-util';

const pathToThisFile = __dirname;
const root = dirname(pathToThisFile);
const distPath = root + '/dist/';
const tmpPath = root + '/tmp';
const requirePath = root + '/distRequired';
const srcPath = root + '/src';
const distDevPath = root + '/distDev';
const appPath = env.app
	? tmpPath + '/apps/' + env.app + '/'
	: 'null';

export const app = appPath;
export const dist = distPath;
export const distDev = distDevPath;
export const require = requirePath;
export const src = srcPath;
export const tmp = tmpPath;
