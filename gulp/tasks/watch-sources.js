import gulp from 'gulp';
import { src, dest } from './gulp/paths.js';

export const watchSass = () => gulp
	.src(src + '/**/*.scss')
	.pipe(sass().on('error', sass.logError))
	.pipe(gulp.dest(dest));
