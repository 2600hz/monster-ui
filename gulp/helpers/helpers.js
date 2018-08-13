import { join } from 'path';
import fs from 'fs';
import parser from 'yargs-parser';
import { src } from '../paths.js';

const getAppsToExclude = () => ['demo_done', 'skeleton', 'tutorial'];

const getDirectories = pathToParse => fs
	.readdirSync(pathToParse)
	.filter(file => fs
		.statSync(join(pathToParse, file))
		.isDirectory());

export const env = parser(process.argv.slice(2));

export const listAllApps = () => getDirectories(src + '/apps');

export const getAppsToInclude = () => listAllApps()
	.filter(app => !getAppsToExclude().includes(app));

export const getProApps = () => env.pro && env.pro.length
	? env.pro.split(',')
	: [];
