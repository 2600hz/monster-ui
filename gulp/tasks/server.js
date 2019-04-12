import watchSources from './watch-sources.js';
import { create } from 'browser-sync';

const server = create();

export const serve = done => {
	server.init({
		server: 'dist'
	}, done)
};

export const watch = done => {
	watchSources(server);
	done();
};
