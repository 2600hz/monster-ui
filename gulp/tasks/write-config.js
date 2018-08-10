import gulp from 'gulp';
import fs from 'fs';
import { env } from 'gulp-util';
import jeditor from 'gulp-json-editor';
import { app, tmp } from '../paths.js';
import {
	getAppsToInclude,
	getProApps,
	listAllApps
} from '../helpers/helpers.js';

const writeFile = (fileName, content) => {
	const json = JSON.stringify(content);
	fs.writeFileSync(fileName, json);
};

const writeBulkAppsConfig = () => {
	let fileName;
	let content;

	listAllApps().forEach(item => {
		fileName = tmp + '/apps/' + item + '/app-build-config.json';
		content = {
			version: getProApps().includes(item)
				? 'pro'
				: 'standard'
		};
		writeFile(fileName, content);
	});
};

const writeConfigProd = () => {
	const mainFileName = tmp + '/build-config.json';
	const content = {
		type: 'production',
		preloadApps: getAppsToInclude()
	};
	writeFile(mainFileName, content);
	writeBulkAppsConfig();
	return gulp.src(mainFileName);
};

const writeConfigDev = () => {
	const fileName = tmp + '/build-config.json';
	const content = {
		version: env.pro
			? 'pro'
			: 'standard'
	};
	writeFile(fileName, content);
	return gulp.src(fileName);
};

const writeConfigApp = () => {
	const fileName = app + 'app-build-config.json';
	const content = {
		version: env.pro
			? 'pro'
			: 'standard'
	};
	writeFile(fileName, content);
	return gulp.src(fileName);
};

gulp.task('write-config-prod', writeConfigProd);
gulp.task('write-config-dev', writeConfigDev);
gulp.task('write-config-app', writeConfigApp);
