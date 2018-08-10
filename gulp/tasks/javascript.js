import gulp from 'gulp';
import uglify from 'gulp-uglify';
import eslint from 'gulp-eslint';
import { app, src, tmp } from '../paths.js';

const minifyJs = () => gulp
	.src([
		tmp + '/js/main.js',
		tmp + '/js/templates.js'
	])
	.pipe(uglify())
	.pipe(gulp.dest(tmp + '/js/'));

const minifyJsApp = () => gulp
	.src(app + 'app.js')
	.pipe(uglify())
	.pipe(gulp.dest(app));

const lint = () => gulp
	.src([
		src + '/**/*.js',
		'!'+ src + '/js/vendor/**/*.js',
		'!'+ src + '/js/lib/kazoo/dependencies/**/*.js'
	])
	.pipe(eslint())
	.pipe(eslint.format());

gulp.task('minify-js', minifyJs);
gulp.task('minify-js-app', minifyJsApp);
gulp.task('lint', lint);
