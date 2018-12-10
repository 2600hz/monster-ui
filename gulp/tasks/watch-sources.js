import gulp from 'gulp';
import cache from 'gulp-cached';
import sass from 'gulp-sass';
import { src, dist } from './gulp/paths.js';

export const watchSass = server =>
	() => gulp
		.src(src + '/**/*.scss')
		.pipe(sass().on('error', sass.logError))
		.pipe(gulp.dest(dist))
		.pipe(server.stream());

export const watchCss = server =>
	() => gulp
		.src(src + '/**/*.css')
		.pipe(gulp.dest(dist))
		.pipe(server.stream());

export const watchJs = server =>
	() => gulp
		.src(src + '/**/*.js')
		.pipe(cache('js'))
		.pipe(gulp.dest(dist))
		.pipe(server.stream());

export const watchHtml = server =>
	() => gulp
		.src(src + '/**/*.html')
		.pipe(cache('html'))
		.pipe(gulp.dest(dist))
		.pipe(server.stream());

export const watchJson = server =>
	() => gulp
		.src(src + '/**/*.json')
		.pipe(cache('json'))
		.pipe(gulp.dest(dist))
		.pipe(server.stream());
