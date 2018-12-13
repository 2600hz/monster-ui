import gulp from 'gulp';
import { writeFileSync } from 'fs';
import { tmp } from '../paths';
import { version } from '../../package.json';

/**
 * Writes version file to display in monster
 */
const writeVersion = () => {
	const fileName = tmp + '/VERSION';
	writeFileSync(fileName, version);
	return gulp.src(fileName);
};

export default writeVersion;
