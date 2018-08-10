import gulp from 'gulp';
import { writeFileSync } from 'fs';
import { tmp } from '../paths';
import { version } from '../../package.json';

const writeVersion = () => {
	let fileName = tmp + '/VERSION';
	writeFileSync(fileName, version);
	return gulp.src(fileName);
};

gulp.task('write-version', writeVersion);
