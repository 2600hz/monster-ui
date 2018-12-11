import del from 'del';
import gulp from 'gulp';
import cache from 'gulp-cached';
import sass from 'gulp-sass';
import path from 'path';
import { src, dist } from '../paths.js';

const watchSass = server =>
	() => gulp
		.src(src + '/**/*.scss')
		.pipe(sass().on('error', sass.logError))
		.pipe(gulp.dest(dist))
		.pipe(server.stream());

const watchCss = server =>
	() => gulp
		.src(src + '/**/*.css')
		.pipe(gulp.dest(dist))
		.pipe(server.stream());

const watchJs = server =>
	() => gulp
		.src(src + '/**/*.js')
		.pipe(cache('js'))
		.pipe(gulp.dest(dist))
		.pipe(server.reload({stream:true}));

const watchHtml = server =>
	() => gulp
		.src(src + '/**/*.html')
		.pipe(cache('html'))
		.pipe(gulp.dest(dist))
		.pipe(server.reload({stream:true}));

const watchJson = server =>
	() => gulp
		.src(src + '/**/*.json')
		.pipe(cache('json'))
		.pipe(gulp.dest(dist))
		.pipe(server.reload({stream:true}));

const watchSources = server => {
	var watchers = [
		gulp.watch(src + '/**/*.scss', watchSass(server)),
		gulp.watch(src + '/**/*.css', watchCss(server)),
		gulp.watch(src + '/**/*.html', watchHtml(server)),
		gulp.watch(src + '/**/*.js', watchJs(server)),
		gulp.watch(src + '/**/*.json', watchJson(server))
	];

	watchers.forEach(watcher => {
		watcher.on('unlink', filePath => {
			var filePathFromSrc = path.relative(path.resolve(src), filePath),
				destFilePath = path.resolve(dist, filePathFromSrc);

			if (filePath.endsWith('.scss')) {
				destFilePath = destFilePath.replace(/\.scss$/, ".css");
			}

			del.sync(destFilePath);

			server.reload();
		})
	});
}

export default watchSources;
