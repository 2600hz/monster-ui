define(function(require){
	var $ = require('jquery'),
		_ = require('underscore'),
		monster = require('monster'),
		timezone = require('monster-timezone');

	var account = {

		subscribe: {
			'myaccount.errorTracker.renderContent': '_errorTrackerRenderContent'
		},

		_errorTrackerRenderContent: function(args){
			var self = this,
				dataTemplate = self.errorTrackerFormatData(monster.logs.error),
				listErrorTemplates = $(monster.template(self, 'errorTracker-layout', dataTemplate));

			self.errorTrackerBindEvents(listErrorTemplates);

			monster.pub('myaccount.renderSubmodule', listErrorTemplates);

			args.callback && args.callback(listErrorTemplates);
		},

		errorTrackerFormatData: function(data) {
			var self = this,
				jsErrors = 0,
				apiErrors = 0;

			_.each(data, function(error) {
				if(error.type === 'api') {
					apiErrors++;
				}
				else if(error.type === 'js') {
					jsErrors++;
				}
			})

			var formattedData = {
					errors: monster.logs.error,
					totalErrors: monster.logs.error.length,
					jsErrors: jsErrors,
					apiErrors: apiErrors
				};

			return formattedData;
		},

		errorTrackerBindEvents: function(template) {
			var self = this;

			template.find('.details').on('click', function() {
				var lineData = $(this).parents('.error-line').data();

				if(lineData.type === 'api') {
					monster.ui.requestErrorDialog(monster.logs.error[lineData.index]);
				}
				else if(lineData.type === 'js') {
					monster.ui.jsErrorDialog(monster.logs.error[lineData.index]);
				}
			});
		}
	};

	return account;
});