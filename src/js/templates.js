Handlebars.getTemplate = function(app, submodule, name, ignoreCache) {
	var _template,
		pathSubmodule = '_' + submodule;

	if (monster.cache.templates === undefined) {
		monster.cache.templates = {};
	}

	if (monster.cache.templates[app.name] === undefined) {
		monster.cache.templates[app.name] = {};
	}

	if (monster.cache.templates[app.name][pathSubmodule] === undefined) {
		monster.cache.templates[app.name][pathSubmodule] = {};
	}

	if (monster.cache.templates[app.name][pathSubmodule][name] && !ignoreCache) {
		_template = monster.cache.templates[app.name][pathSubmodule][name];
	} else {
		var options = {};

		if (name.substring(0, 1) === '!') { // ! indicates that it's a string template
			_template = name.substring(1);
			options.noEscape = true;
		} else {
			var destinationUrl = submodule === 'main' ? app.appPath + '/views/' + name + '.html' : app.appPath + '/submodules/' + submodule + '/views/' + name + '.html';

			monster.pub('monster.requestStart');

			$.ajax({
				url: monster.util.cacheUrl(app, destinationUrl),
				dataType: 'text',
				async: false,
				success: function(result) {
					_template = result;
					monster.pub('monster.requestEnd');
				},
				error: function(xhr, status, err) {
					_template = status + ': ' + err;
					monster.pub('monster.requestEnd');
				}
			});
		}

		_template = Handlebars.compile(_template, options);
		monster.cache.templates[app.name][pathSubmodule][name] = _template;
	}

	monster.pub('monster.onTemplateLoad', {
		app: app,
		submodule: submodule,
		name: name
	});

	return _template;
};
