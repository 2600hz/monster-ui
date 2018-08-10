import gulp from 'gulp';
import clean from 'gulp-clean';
import { dist, distDev, src, tmp } from '../paths.js';

const cleanTmp = () => gulp
	.src(tmp, {
		allowEmpty: true,
		read: false
	})
	.pipe(clean());

const cleanDistDev = () => gulp
	.src(distDev, {
		allowEmpty: true,
		read: false
	})
	.pipe(clean());

const cleanDist = () => gulp
	.src(dist, {
		allowEmpty: true,
		read: false
	})
	.pipe(clean());

const moveBuiltFilesDist = () => gulp
	.src([
		tmp + '/**/*',
		'!' + tmp + '**/*.scss'
	])
	.pipe(gulp.dest(dist));

const moveFilesToTmp = () => gulp
	.src(src + '/**/*')
	.pipe(gulp.dest(tmp));

const moveDistDev = () => gulp
	.src(dist + '/**/*')
	.pipe(gulp.dest(distDev));

gulp.task('clean-tmp', cleanTmp);
gulp.task('move-files-to-tmp', gulp.series(cleanTmp, moveFilesToTmp));
gulp.task('move-dist-dev', gulp.series(cleanDistDev, moveDistDev));
gulp.task('clean-folders', gulp.series(
	cleanDist,
	moveBuiltFilesDist,
	cleanTmp
));
