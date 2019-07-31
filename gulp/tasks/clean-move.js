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
		'!' + join(tmp, 'apps', '*', 'tests'),	// Exclude tests folder from apps
		'!' + join(tmp, 'apps', '*', 'tests', '**', '**')	// Exclude tests folder contents
	])
	.pipe(gulp.dest(dist));

const moveDistFilesToDev = () => gulp
	.src(join(dist, '**', '*'))
	.pipe(gulp.dest(distDev));

const moveSrcFilesToTmp = () => gulp
	.src(join(src, '**', '*'))
	.pipe(gulp.dest(tmp));


export const cleanTmp = () => gulp
	.src(tmp, {
		allowEmpty: true,
		read: false
	})
	.pipe(vinylPaths(del));

/**
 * cleanTmp
 * moveFilesToTmp
 *
 * Moves all files to tmp folder
 */
export const moveFilesToTmp = gulp.series(
	cleanTmp,
	moveSrcFilesToTmp
);

/**
 * cleanDistDev
 * moveDistDev
 */
export const moveDistDev = gulp.series(
	cleanDistDev,
	moveDistFilesToDev
);

/**
 * cleanDist
 * moveBuiltFilesDist
 * cleanTmp
 *
 * Moves tmp to dist and removes tmp after that
 */
export const cleanFolders = gulp.series(
	cleanDist,
	moveBuiltFilesToDist,
	cleanTmp
);
