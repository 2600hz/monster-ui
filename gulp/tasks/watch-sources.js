import browserSync from 'browser-sync';
import del from 'del';
import gulp from 'gulp';
import cache from 'gulp-cached';
import sass from 'gulp-sass';
import path from 'path';
import { src, dist } from '../paths.js';

/**
 * Build gulp pipeline for watch events
 * @param  {Object}                          args
 * @param  {browserSync.BrowserSyncInstance} args.server            BrowserSync server instance
 * @param  {String}                          args.fileExt           Input file extension
 * @param  {Boolean}                         [args.useCache=false]  Use cache
 * @param  {Boolean}                         [args.reload=false]    Reload server
 * @param  {NodeJS.ReadWriteStream}          [args.process]         Additional process step on pipeline
 */
const buildWatchPipeline = args => {
	let fileExt = args.fileExt,
		process = args.process,
		useCache = !!args.useCache,
		reload = !!args.reload,
		server = args.server,
		pipeline = gulp.src(`${src}/**/*.${fileExt}`);

	if (process) {
		pipeline = pipeline.pipe(process);
	}
	if (useCache) {
		pipeline = pipeline.pipe(cache(fileExt));
	}

	pipeline = pipeline.pipe(gulp.dest(dist))

	if (reload) {
		return pipeline.pipe(server.reload({stream:true}));
	}

	return pipeline.pipe(server.stream());
}

const getWatchSassFn = server =>
	// Return a named function, to allow Gulp to display its name
	function watchSass() {
		return buildWatchPipeline({
			server,
			fileExt: 'scss',
			process: sass().on('error', sass.logError)
		});
	};

const getWatchCssFn = server =>
	// Return a named function, to allow Gulp to display its name
	function watchCss() {
		return buildWatchPipeline({
			server,
			fileExt: 'css'
		});
	};

const getWatchJsFn = server =>
	// Return a named function, to allow Gulp to display its name
	function watchJs() {
		return buildWatchPipeline({
			server,
			fileExt: 'js',
			useCache: true,
			reload: true
		});
	};

const getWatchHtmlFn = server =>
	// Return a named function, to allow Gulp to display its name
	function watchHtml() {
		return buildWatchPipeline({
			server,
			fileExt: 'html',
			useCache: true,
			reload: true
		});
	};

const getWatchJsonFn = server =>
	// Return a named function, to allow Gulp to display its name
	function watchJson() {
		return buildWatchPipeline({
			server,
			fileExt: 'json',
			useCache: true,
			reload: true
		});
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
