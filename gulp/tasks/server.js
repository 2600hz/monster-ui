import gulp from 'gulp';
import { create } from 'browser-sync';
import { join, normalize, relative, resolve } from 'upath';
import del from 'del';
import cache from 'gulp-cached';
import { src, dist } from '../paths.js';
import { sass } from '../helpers/helpers.js';

const server = create();

const cssWatcher = () => gulp
	.src(join(src, '**', '*.css'))
	.pipe(gulp.dest(dist))
	.pipe(server.stream());

const htmlWatcher = () => gulp
	.src(join(src, '**', '*.html'))
	.pipe(cache('html'))
	.pipe(gulp.dest(dist))
	.pipe(server.reload({ stream: true }));

const jsWatcher = () => gulp
	.src(join(src, '**', '*.js'))
	.pipe(cache('js'))
	.pipe(gulp.dest(dist))
	.pipe(server.reload({ stream: true }));

const jsonWatcher = () => gulp
	.src(join(src, '**', '*.json'))
	.pipe(cache('json'))
	.pipe(gulp.dest(dist))
	.pipe(server.reload({ stream: true }));

const scssWatcher = () => gulp
	.src(join(src, '**', '*.scss'))
	.pipe(sass().on('error', sass.logError))
	.pipe(gulp.dest(dist))
	.pipe(server.stream());

const unlinkHandler = filePath => {
	const filePathFromSrc = relative(resolve(src), normalize(filePath));
	let destFilePath = resolve(dist, filePathFromSrc);

	if (filePath.endsWith('.scss')) {
		destFilePath = destFilePath.replace(/\.scss$/, ".css");
	}

	del.sync(destFilePath);

	server.reload();
};

export const serve = done => {
	server.init({
		server: 'dist'
	}, done)
};

export const watch = done => {
	let watchers = [
		gulp.watch(join(src, '**', '*.css'), cssWatcher),
		gulp.watch(join(src, '**', '*.html'), htmlWatcher),
		gulp.watch(join(src, '**', '*.js'), jsWatcher),
		gulp.watch(join(src, '**', '*.json'), jsonWatcher),
		gulp.watch(join(src, '**', '*.scss'), scssWatcher)
	];

	watchers.forEach(watcher => watcher.on('unlink', unlinkHandler));

	done();
};
