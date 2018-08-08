var gulp = require('gulp');
var clean = require('gulp-clean');

var paths = require('../paths.js');

function cleanTmp() {
	return gulp
		.src(paths.tmp, {
			allowEmpty: true,
			read: false
		})
		.pipe(clean());
}

function cleanDistDev() {
	return gulp
		.src(paths.distDev, {
			allowEmpty: true,
			read: false
		})
		.pipe(clean());
}

function cleanDist() {
	return gulp
		.src(paths.dist, {
			allowEmpty: true,
			read: false
		})
		.pipe(clean());
}

function moveBuiltFilesDist() {
	return gulp
		.src([
			'!' + paths.tmp + '/**/*.scss',
			paths.tmp + '/**/*'
		])
		.pipe(gulp.dest(paths.dist)); // Move the files selected to the dist path
}

function moveFilesToTmp() {
	return gulp
		.src([
			paths.src + '/**/*'
		])
		.pipe(gulp.dest(paths.tmp)); // Move the files selected to the dist path
}

function moveDistDev() {
	return gulp
		.src(paths.dist + '/**/*')
		.pipe(gulp.dest(paths.distDev));
}

gulp.task('clean-tmp', cleanTmp);
gulp.task('move-files-to-tmp', gulp.series(cleanTmp, moveFilesToTmp));
gulp.task('move-dist-dev', gulp.series(cleanDistDev, moveDistDev));
gulp.task('clean-folders', gulp.series(cleanDist, moveBuiltFilesDist, cleanTmp));
