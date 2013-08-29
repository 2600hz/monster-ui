define(function(require){
	var $ = require('jquery'),
		_ = require('underscore'),
		monster = require('monster');

	var app = {
		requests: {
		},

		subscribe: {
			'voip.myOffice.render': 'myOfficeRender'
		},

		/* My Office */
		myOfficeRender: function(parent) {
			var self = this,
				dataTemplate = {

				};

			dataTemplate = self.myOfficeFormatData(dataTemplate);

			var template = monster.template(self, 'myOffice-layout', dataTemplate);

			self.myOfficeBindEvents(template);

			parent
				.empty()
				.append(template);
		},

		myOfficeFormatData: function(data) {
			return data;
		},

		myOfficeBindEvents: function(template) {

		}
	};

	return app;
});
