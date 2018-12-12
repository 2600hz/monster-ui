import del from 'del';
import gulp from 'gulp';
import cache from 'gulp-cached';
import sass from 'gulp-sass';
import path from 'path';
import { src, dist } from '../paths.js';

const getWatchSassFn = server =>
	// Return a named function, to allow Gulp to display its name
	function watchSass() {
		return gulp
			.src(src + '/**/*.scss')
			.pipe(sass().on('error', sass.logError))
			.pipe(gulp.dest(dist))
			.pipe(server.stream());
	};

const getWatchCssFn = server =>
	// Return a named function, to allow Gulp to display its name
	function watchCss() {
		return gulp
			.src(src + '/**/*.css')
			.pipe(gulp.dest(dist))
			.pipe(server.stream());
	};

const getWatchJsFn = server =>
	// Return a named function, to allow Gulp to display its name
	function watchJs() {
		return gulp
			.src(src + '/**/*.js')
			.pipe(cache('js'))
			.pipe(gulp.dest(dist))
			.pipe(server.reload({stream:true}));
	};

const getWatchHtmlFn = server =>
	// Return a named function, to allow Gulp to display its name
	function watchHtml() {
		return gulp
			.src(src + '/**/*.html')
			.pipe(cache('html'))
			.pipe(gulp.dest(dist))
			.pipe(server.reload({stream:true}));
	};

const getWatchJsonFn = server =>
	// Return a named function, to allow Gulp to display its name
	function watchJson() {
		return gulp
			.src(src + '/**/*.json')
			.pipe(cache('json'))
			.pipe(gulp.dest(dist))
			.pipe(server.reload({stream:true}));
	};

const getUnlinkFileFn = server =>
	filePath => {
		var filePathFromSrc = path.relative(path.resolve(src), filePath),
			destFilePath = path.resolve(dist, filePathFromSrc);

		if (filePath.endsWith('.scss')) {
			destFilePath = destFilePath.replace(/\.scss$/, ".css");
		}

		del.sync(destFilePath);

		server.reload();
	};

const watchSources = server => {
	let watchers = [
		gulp.watch(src + '/**/*.scss', getWatchSassFn(server)),
		gulp.watch(src + '/**/*.css', getWatchCssFn(server)),
		gulp.watch(src + '/**/*.js', getWatchJsFn(server)),
		gulp.watch(src + '/**/*.html', getWatchHtmlFn(server)),
		gulp.watch(src + '/**/*.json', getWatchJsonFn(server))
	];

	// Handle delete file events
	watchers.forEach(watcher => watcher.on('unlink', getUnlinkFileFn(server)));
}

export default watchSources;
