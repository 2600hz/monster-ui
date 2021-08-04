import {
	env,
	getAppsToExclude,
	isProdBuild,
	mode
} from '../helpers/helpers.js';
import { join } from 'upath';
import gulp from 'gulp';
import del from 'del';
import vinylPaths from 'vinyl-paths';
import { dist, distDev, src, tmp } from '../paths.js';

const cleanDist = () => gulp
	.src(dist, {
		allowEmpty: true,
		read: false
	})
	.pipe(vinylPaths(del));

const cleanDistDev = () => gulp
	.src(distDev, {
		allowEmpty: true,
		read: false
	})
	.pipe(vinylPaths(del));

const moveBuiltFilesToDist = () => gulp
	.src([
		join(tmp, '**', '*'),
		'!' + join(tmp, '**', '*.scss'),
		'!' + join(tmp, 'apps', '*', 'tests'),
		'!' + join(tmp, 'apps', '*', 'tests', '**', '*')
	])
	.pipe(gulp.dest(dist));

const moveDistFilesToDev = () => gulp
	.src(join(dist, '**', '*'))
	.pipe(gulp.dest(distDev));

const moveSrcFilesToTmp = () => gulp
	.src([
		join(src, '**', '*'),
		...(isProdBuild ? getAppsToExclude(
			mode === 'app' && env.app
		).flatMap(
			app => [
				'!' + join(src, 'apps', app),
				'!' + join(src, 'apps', app, '**', '*')
			]
		) : [])
	])
	.pipe(gulp.dest(tmp));

const cleanTmp = () => gulp
	.src(tmp, {
		allowEmpty: true,
		read: false
	})
	.pipe(vinylPaths(del));

export const moveFilesToTmp = gulp.series(
	cleanTmp,
	moveSrcFilesToTmp
);

export const moveDistDev = gulp.series(
	cleanDistDev,
	moveDistFilesToDev
);

export const cleanFolders = gulp.series(
	cleanDist,
	moveBuiltFilesToDist,
	cleanTmp
);
