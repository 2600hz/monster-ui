import { join } from 'upath';
import fs from 'fs';
import parser from 'yargs-parser';
import { src } from '../paths.js';
import nodeSass from 'node-sass';
import gulpSass from 'gulp-sass';
import tildeImporter from 'node-sass-tilde-importer';

const getAppsToExclude = () => ['demo_done', 'skeleton', 'tutorial'];

const getDirectories = pathToParse => fs
	.readdirSync(pathToParse)
	.filter(file => fs
		.statSync(join(pathToParse, file))
		.isDirectory());

export const env = parser(process.argv.slice(2));

export const listAllApps = () => getDirectories(join(src, 'apps'));

export const getAppsToInclude = () => listAllApps()
	.filter(app => !getAppsToExclude().includes(app));

export const mode = env.app && env.app.length ? 'app' : 'whole';

export const getProApps = () => ({
		app: env.pro === true ? [env.app] : [],
		whole: env.pro && env.pro.length ? env.pro.split(',') : []
	}[mode]);

const compileSass = gulpSass(nodeSass);

export const sass = () => compileSass({
    importer: tildeImporter
});

sass.logError = compileSass.logError.bind(sass);
