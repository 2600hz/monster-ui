
require.config({
	waitSeconds: 200,
	paths: {
		'async': 'js/lib/async',
		'bootstrap': 'js/lib/bootstrap-2.3.1.min',
		'bootstrap-clickover': 'js/lib/bootstrapx-clickover-1.0',
		'chart': 'js/lib/chart.min',
		'card': 'js/lib/card',
		'chosen': 'js/lib/jquery.chosen.min',
		'crossroads': 'js/lib/crossroads.min',
		'clipboard': 'js/lib/clipboard.min',
		'config': 'js/config',
		'datatables': 'js/lib/tables/jquery.dataTables-1.8',
		'dependClass': 'js/lib/jquery.dependClass',
		'ddslick': 'js/lib/jquery.ddslick.min',
		'drop': 'js/lib/drop',
		'fileupload': 'js/lib/jquery.fileupload',
		'footable': 'js/lib/footable/footable.min',
		'form2object': 'js/lib/form2object',
		'handlebars': 'js/lib/handlebars-v4.0.5',
		'hasher': 'js/lib/hasher.min',
		'hotkeys': 'js/lib/jquery.hotkeys.min',
		'introJs': 'js/lib/intro.min',
		'isotope': 'js/lib/jquery.isotope.min',
		'jquery': 'js/lib/jquery-1.9.1.min',
		'jqueryui': 'js/lib/jquery-ui-1.10.3.custom.min',
		'jstz': 'js/lib/jstz.min',
		'kazoo': 'js/lib/kazoo',
		'kazoosdk': 'js/lib/jquery.kazoosdk',
		'mask': 'js/lib/jquery.mask',
		'modernizr': 'js/lib/modernizr-2.6.2.min',
		'monster': 'js/lib/monster',
		'monster-apps': 'js/lib/monster.apps',
		'monster-ui': 'js/lib/monster.ui',
		'monster-timezone': 'js/lib/monster.timezone',
		'monster-routing': 'js/lib/monster.routing',
		'monster-socket': 'js/lib/monster.socket',
		'monster-util': 'js/lib/monster.util',
		'monster-webphone': 'js/lib/monster.webphone',
		'mousetrap': 'js/lib/mousetrap-1.5.3.min',
		'nicescroll': 'js/lib/jquery.nicescroll.min',
		'plugins': 'js/plugins',
		'papaparse': 'js/lib/papaparse-4.1.2.min',
		'postal': 'js/lib/postal-0.8.2',
		'prettify':'js/lib/prettify',
		'renderjson': 'js/lib/renderjson',
		'reqwest': 'js/lib/reqwest-0.7.3.min',
		'signals': 'js/lib/signals.min',
		'slider': 'js/lib/jquery.slider',
		'tether': 'js/lib/tether.min',
		'timepicker': 'js/lib/jquery.timepicker.min',
		'toastr': 'js/lib/toastr-1.3.0',
		'touch-punch': 'js/lib/jquery.ui.touch-punch.min',
		'underscore': 'js/lib/underscore.min',
		'validate': 'js/lib/jquery.validate.min',
		'vkbeautify':'js/lib/vkbeautify',
		'wysiwyg': 'js/lib/bootstrap.wysiwyg.min',
		'pdfjs-dist/build/pdf': 'js/lib/pdfjs/build/pdf',
		'pdfjs-dist/build/pdf.worker': 'js/lib/pdfjs/build/pdf.worker',
		'templates': 'js/templates'
	},
	shim: {
		'drop': ['tether'],
		'footable-sort': ['footable'],
		'footable-filter': ['footable'],
		'bootstrap': ['jqueryui'],
		'bootstrap-clickover': ['bootstrap'],
		'datatables': ['jquery'],
		'jqueryui': ['jquery'],
		'crossroads': ['signals'],
		'hasher': ['signals'],
		'slider': ['dependClass'],
		'plugins': ['jquery'],
		'kazoosdk': ['jquery'],
		'touch-punch': ['jqueryui'],
		'footable': {
			'exports': 'FooTable'
		},
		'underscore': {
			'exports': '_'
		},
		'kazoo': {
			'exports': 'kazoo'
		}
	},
	urlArgs: 'bust=' + (new Date()).getTime()
});

require(['jquery', 'monster', 'modernizr', 'plugins', 'bootstrap', 'bootstrap-clickover', 'touch-punch'], function($, monster){
	$.support.cors = true;

	monster.initSDK();

	require(['monster-util', 'monster-ui', 'monster-apps', 'monster-routing', 'monster-socket', 'monster-timezone', 'monster-webphone', 'templates'], function(util, ui, apps, routing, socket, timezone, webphone, templates){
		monster.util = util;
		monster.ui = ui;
		monster.apps = apps;
		monster.routing = routing;
		monster.socket = socket;
		monster.timezone = timezone;
		monster.webphone = webphone;

		monster.util.setDefaultLanguage();

		monster.loadBuildConfig(function() {
			monster.apps.load('core', function(app){
				app.render($('.core-wrapper'));
			});
		});
	});
});
