const semver = require('semver');

// Globs for files to be transpiled
var	onlyFileGlobs = [
	"gulpfile.*",
	"gulp/*"
];

// If Node version is lower than 6, include node modules that use ES2015+ features
if (semver.satisfies(process.version, "<6.0.0")) {
	onlyFileGlobs = onlyFileGlobs.concat([
		"eslint/*",
		"espree/*",
		"gulp-eslint/*",
		"gulp-sass/*",
		"ignore/*"
	])
}

// Set .babelrc configs
module.exports = {
    presets: ["env"],
    only: onlyFileGlobs
};
