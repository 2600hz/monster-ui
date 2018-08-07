var gulp = require('gulp');
var clean = require('gulp-clean');
var paths = require('../paths.js');

gulp.task(
	'clean-tmp',
	function() {
		return gulp
			.src(paths.tmp, {read: false,allowEmpty: true})
			.pipe(clean());
	}
);

gulp.task(
	'clean-dist',
	function() {
		return gulp
			.src(paths.dist, {read: false,allowEmpty: true})
			.pipe(clean());
	}
);

gulp.task(
	'clean-dist-dev',
	function() {
		return gulp
			.src(paths.distDev, {read: false,allowEmpty: true})
			.pipe(clean());
	}
);

gulp.task(
	'clean-require',
	function() {
		return gulp
			.src(paths.require, {read: false,allowEmpty: true})
			.pipe(clean());
	}
);

gulp.task(
	'move-built-files-dist',
	gulp.series(
		'clean-dist',
		function() {
			return gulp
				.src([
					'!' + paths.tmp + '/**/*.scss',
					paths.tmp + '/**/*'
				])
				.pipe(gulp.dest(paths.dist)); // Move the files selected to the dist path
		}
	)
);

gulp.task(
	'clean-folders',
	gulp.series(
		'move-built-files-dist', // moves all files to dist
		'clean-tmp', // empty tmp
		function(done) {
			done();
		}
	)
);

gulp.task(
	'move-files-to-tmp',
	gulp.series(
		'clean-tmp',
		function() {
			return gulp
				.src([
					paths.src + '/**/*'
				])
				.pipe(gulp.dest(paths.tmp)); // Move the files selected to the dist path
		}
	)
);

gulp.task(
	'move-dist-dev',
	gulp.series(
		'clean-dist-dev',
		function() {
			return gulp
				.src(paths.dist + '/**/*')
				.pipe(gulp.dest(paths.distDev));
		}
	)
);
