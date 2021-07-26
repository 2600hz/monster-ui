import { join } from 'upath';
import gulp from 'gulp';
import fs from 'fs';
import { app, tmp } from '../paths.js';
import {
	env,
	getAppsToInclude,
	getProApps,
	listAllApps
} from '../helpers/helpers.js';

const writeFile = (fileName, content) => {
	const json = JSON.stringify(content);
	fs.writeFileSync(fileName, json);
};

const readFile = filePath => JSON.parse(
		fs.readFileSync(filePath)
	);

const isProApp = appName => getProApps()
	.includes(appName);

const writeFrameworkConfig = buildType => {
	const configFilePath = join(tmp, 'build-config.json');
	const configsPerBuildType = {
		dev: {
			type: 'development'
		},
		prod: {
			type: 'production',
			preloadApps: getAppsToInclude()
		}
	};
	const config = configsPerBuildType[buildType];

	writeFile(configFilePath, config);

	return configFilePath;
};

const writeAppConfig = appName => {
	const configFilePath = join(tmp, 'apps', appName, 'app-build-config.json');
	const config = {
		version: isProApp(appName) ? 'pro' : 'standard'
	};

	writeFile(configFilePath, config);

	return configFilePath;
};

const writeAppMetadata = appName => {
	const metadataFolderPath = join(tmp, 'apps', appName, 'metadata');
	const metadataFilePath = join(metadataFolderPath, 'app.json');
	const metadataProFilePath = join(metadataFolderPath, 'app-pro.json');
	let metadata;

	if (!isProApp(appName)) {
		return;
	}
	try {
		fs.renameSync(
			metadataProFilePath,
			metadataFilePath
		);
	} catch (error) {
	}

	try {
		metadata = readFile(metadataFilePath);
	} catch (error) {
		metadata = {
			name: appName
		};
	}

	if (metadata.name.slice(-4) !== '-pro') {
		metadata.name += '-pro';
		writeFile(metadataFilePath, metadata);
	}
};

const writeAppFiles = appName => ([
		writeAppConfig(appName),
		writeAppMetadata(appName)
	]);

const writeBulkAppsConfig = () => listAllApps()
	.forEach(writeAppFiles);

/**
 * Writes a config file for monster to know which apps have been minified so it
 * doesn't reload the assets
 */
export const writeConfigProd = () => {
	const configFilePath = writeFrameworkConfig('prod');
	writeBulkAppsConfig();
	return gulp.src(configFilePath);
};

export const writeConfigDev = () => {
	const configFilePath = writeFrameworkConfig('dev');
	writeBulkAppsConfig();
	return gulp.src(configFilePath);
};

/**
 * Add flags if needed, like pro/lite version
 */
export const writeConfigApp = () => {
	const [configFilePath] = writeAppFiles(env.app);
	return gulp.src(configFilePath);
};
