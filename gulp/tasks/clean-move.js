var gulp = require('gulp');
var runSequence = require('run-sequence');
var clean = require('gulp-clean');
var paths = require('../paths.js');

gulp.task('clean-folders', function(cb) {
	runSequence( 
		'move-built-files-dist', // moves all files to dist
		'clean-tmp', // empty tmp
		cb
	);
});

gulp.task('move-files-to-tmp', ['clean-tmp'], function() {
	return gulp.src([
			paths.src + '/**/*'
		])
		.pipe(gulp.dest(paths.tmp)); // Move the files selected to the dist path
});

gulp.task('move-built-files-dist', ['clean-dist'], function() {
	return gulp.src([
			'!' + paths.tmp + '/**/*.scss',
			paths.tmp + '/**/*'
		])
		.pipe(gulp.dest(paths.dist)); // Move the files selected to the dist path
});

gulp.task('move-dist-dev', ['clean-dist-dev'], function() {
	return gulp.src(paths.dist + '/**/*')
			.pipe(gulp.dest(paths.distDev));
});

gulp.task('clean-require', function() {
	return gulp.src(paths.require, {read: false})
			.pipe(clean());
});

gulp.task('clean-dist', function() {
	return gulp.src(paths.dist, {read: false})
			.pipe(clean());
});

gulp.task('clean-dist-dev', function() {
	return gulp.src(paths.distDev, {read: false})
			.pipe(clean());
});

gulp.task('clean-tmp', function() {
	return gulp.src(paths.tmp, {read: false})
		.pipe(clean());
});
