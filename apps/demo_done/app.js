define(function(require){
	var $ = require('jquery'),
		_ = require('underscore'),
		monster = require('monster'),
		toastr = require('toastr');

	var app = {
		name: 'skeleton',

		i18n: [ 'en-US', 'fr-FR' ],

		requests: {},

		subscribe: {},

		load: function(callback){
			var self = this;

			self.initApp(function() {
				callback && callback(self);
			});
		},

		initApp: function(callback) {
			var self = this;

			/* Used to init the auth token and account id of this app */
			monster.pub('auth.initApp', {
				app: self,
				callback: callback
			});
		},

		render: function(container){
			var self = this,
				skeletonTemplate = $(monster.template(self, 'layout')),
				parent = _.isEmpty(container) ? $('#ws-content') : container;

			self.bindEvents(skeletonTemplate);

			(parent)
				.empty()
				.append(skeletonTemplate);
		},

		bindEvents: function(template) {
			var self = this;

			template.find('#search').on('click', function(e) {
				self.searchNumbers(415, function(listNumbers) {
					var dataTemplate = {
							numbers: listNumbers
						},
						results = monster.template(self, 'results', dataTemplate);
						
					template
						.find('.results')
						.empty()
						.append(results);
				});
			});
		},

		//utils
		searchNumbers: function(pattern, callback) {
			var self = this;

			self.callApi({
				resource: 'numbers.search',
				data: {
					pattern: pattern,
					limit: 15,
					offset: 0
				},
				success: function(listNumbers) {
					callback && callback(listNumbers.data);
				}
			});
		}
	};

	return app;
});
