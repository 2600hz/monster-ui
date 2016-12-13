define(function(require){
	var $ = require('jquery'),
		_ = require('underscore'),
		monster = require('monster'),
		toastr = require('toastr');

	var app = {
		name: 'tutorial',

		externalScripts: [ 'example' ],

		css: [ 'app' ],

		i18n: { 
			'en-US': { customCss: false },
			'fr-FR': { customCss: true }
		},

		requests: {
			/* This will use the default api url given in js/config.js. If you want to use your own api you can use the following

			'skeleton.listNumbers': {
				apiRoot: 'http://yourapiurl/',
				url: 'phone_numbers?prefix={pattern}&quantity={size}',
				verb: 'GET'
			}

			*/
			'skeleton.listNumbers': {
				url: 'phone_numbers?prefix={pattern}&quantity={size}',
				verb: 'GET'
			}
		},

		subscribe: {
			'pbxsManager.activate': '_render'
		},

		load: function(callback){
			var self = this;

			self.initApp(function() {
				callback && callback(self);
			});
		},

		initApp: function(callback) {
			var self = this;

			/* Used to init the auth token and account id */
			monster.pub('auth.initApp', {
				app: self,
				callback: callback
			});
		},

		render: function(container){
			var self = this;

			self._render(container);
		},

		// subscription handlers
		_render: function(container) {
			var self = this,
				skeletonTemplate = $(monster.template(self, 'layout')),
				parent = _.isEmpty(container) ? $('#monster-content') : container;

			self.bindEvents(skeletonTemplate);

			(parent)
				.empty()
				.append(skeletonTemplate);
		},

		bindEvents: function(template) {
			var self = this;

			template.find('#search').on('click', function(e) {
				self.searchNumbers(650, 15, function(listNumbers) {
					var results = monster.template(self, 'results', { numbers: listNumbers});

					template
						.find('.results')
						.empty()
						.append(results);
				});
			});
		},

		//utils
		searchNumbers: function(pattern, size, callback) {
			var self = this;

			monster.request({
				resource: 'skeleton.listNumbers',
				data: {
					pattern: pattern,
					size: size
				},
				success: function(listNumbers) {
					callback && callback(listNumbers.data);
				}
			});
		}
	};

	return app;
});
