import { join } from 'upath';
import fs from 'fs';
import parser from 'yargs-parser';
import { src } from '../paths.js';

const frameworkApps = [
	'apploader',
	'appstore',
	'auth',
	'common',
	'core',
	'myaccount'
];

const appsToExclude = ['demo_done', 'skeleton', 'tutorial'];

const getDirectories = pathToParse => fs
	.readdirSync(pathToParse)
	.filter(file => fs
		.statSync(join(pathToParse, file))
		.isDirectory());

export const getAppsToExclude = appToInclude => getDirectories(
		join(src, 'apps')
	)
	.filter(
		dir => ![
			...(appToInclude ? [appToInclude] : []),
			...frameworkApps
		].includes(dir)
	);

export const env = parser(process.argv.slice(2));

export const listAllApps = () => getDirectories(join(src, 'apps'));

export const getAppsToInclude = () => frameworkApps;

export const mode = env.app && env.app.length ? 'app' : 'whole';

export const getProApps = () => ({
		app: env.pro === true ? [env.app] : [],
		whole: env.pro && env.pro.length ? env.pro.split(',') : []
	}[mode]);

export const isProdBuild = !![
		'build-app',
		'build-prod'
	].find(
		command => env._.includes(command)
	);
