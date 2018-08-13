import gulp from 'gulp';
import clean from 'gulp-clean';
import { dist, distDev, src, tmp } from '../paths.js';

export const cleanTmp = () => gulp
	.src(tmp, {
		allowEmpty: true,
		read: false
	})
	.pipe(clean());

/**
 * cleanTmp
 * moveFilesToTmp
 *
 * Moves all files to tmp folder
 */
export const moveFilesToTmp = gulp.series(
	cleanTmp,
	() => gulp
		.src(src + '/**/*')
		.pipe(gulp.dest(tmp))
);

/**
 * cleanDistDev
 * moveDistDev
 */
export const moveDistDev = gulp.series(
	() => gulp
		.src(distDev, {
			allowEmpty: true,
			read: false
		})
		.pipe(clean()),
	() => gulp
		.src(dist + '/**/*')
		.pipe(gulp.dest(distDev))
);

/**
 * cleanDist
 * moveBuiltFilesDist
 * cleanTmp
 *
 * Moves tmp to dist and removes tmp after that
 */
export const cleanFolders = gulp.series(
	() => gulp
		.src(dist, {
			allowEmpty: true,
			read: false
		})
		.pipe(clean()),
	() => gulp
		.src([
			tmp + '/**/*',
			'!' + tmp + '**/*.scss'
		])
		.pipe(gulp.dest(dist)),
	cleanTmp
);
