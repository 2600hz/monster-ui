
require.config({
	paths: {
		async: 'js/lib/async',
		bootstrap: 'js/lib/bootstrap-2.3.1.min',
		'bootstrap-switch': 'js/lib/bootstrapSwitch-1.8.min',
		'bootstrap-clickover': 'js/lib/bootstrapx-clickover-1.0',
		datatables: 'js/lib/tables/jquery.dataTables-1.8',
		ddslick: 'js/lib/jquery.ddslick.min',
		footable: 'js/lib/footable/footable.min',
		'footable-sort': 'js/lib/footable/footable.sort.min',
		'footable-filter': 'js/lib/footable/footable.filter.min',
		form2object: 'js/lib/form2object',
		handlebars: 'js/lib/handlebars-1.0.10',
		hotkeys: 'js/lib/jquery.hotkeys.min',
		icheck: 'js/lib/jquery.icheck.min',
		isotope: 'js/lib/jquery.isotope.min',
		jquery: 'js/lib/jquery-1.9.1.min',
		jqueryui: 'js/lib/jquery-ui-1.10.3.custom.min',
		jstz: 'js/lib/jstz.min',
		leaflet: 'js/lib/leaflet.min',
		monster: 'js/lib/monster',
		'monster-ui': 'js/lib/monster.ui',
		'monster-timezone': 'js/lib/monster.timezone',
		'monster-util': 'js/lib/monster.util',
		nicescroll: 'js/lib/jquery.nicescroll.min',
		'monster-apps': 'js/lib/monster.apps',
		plugins: 'js/plugins',
		postal: 'js/lib/postal-0.8.2',
		reqwest: 'js/lib/reqwest-0.7.3.min',
		toastr: 'js/lib/toastr-1.3.0.min',
		timepicker: 'js/lib/jquery.timepicker.min',
		socket: 'js/lib/socket.io.min',
		underscore: 'js/lib/underscore-1.4.4.min',
		wysiwyg: 'js/lib/bootstrap.wysiwyg.min'
	},
	shim: {
		'footable-sort': ['footable'],
		'footable-filter': ['footable'],
		bootstrap: ['jqueryui'],
		'bootstrap-switch': ['bootstrap'],
		'bootstrap-clickover': ['bootstrap'],
		datatables: ['jquery'],
		jqueryui: ['jquery'],
		handlebars: {
			exports: 'Handlebars'
		},
		plugins: ['jquery'],
		underscore: {
			exports: '_'
		}
	},
	urlArgs: 'bust=' + (new Date()).getTime()
});

require(['jquery', 'monster', 'plugins', 'bootstrap', 'bootstrap-switch', 'bootstrap-clickover'], function($, monster){
	$.support.cors = true;

	require(['monster-util', 'monster-ui', 'monster-apps', 'socket'], function(util, ui, apps, socket){
		monster.util = util;
		monster.ui = ui;
		monster.apps = apps;

		if('socket' in monster.config.api) {
			monster.socket = io.connect(monster.config.api.socket);
		}

		$(function(){
			monster.apps.load('core', function(app){
				app.render($('#main section'));
			});
		});
	});
});
