define(function(require) {
	var monster = require('monster');

	return {
		subscribe: {
			'monster.onTemplateLoad': 'onTemplateLoad'
		},

		onTemplateLoad: function(args) {
			var app = args.app,
				submodule = args.submodule,
				name = args.name;

			if (!_.isUndefined(hj)) {
				setTimeout(function() {
					hj('trigger', app.name + '_' + submodule + '_' + name);
				}, 2);
			}
		}
	}
});
