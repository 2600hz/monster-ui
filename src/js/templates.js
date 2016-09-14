// Hackt files where all of our templates specified in the build will end up
Handlebars.getTemplate = function(app, name, ignoreCache) {
	var _template;

	if(monster.cache.templates === undefined) {
		monster.cache.templates = {};
	}

	if(monster.cache.templates[app.name] === undefined) {
		monster.cache.templates[app.name] = {};
	}

	if(monster.cache.templates[app.name][name] && !ignoreCache){
		_template = monster.cache.templates[app.name][name];
	}
	else {
		if(name.substring(0, 1) === '!'){ // ! indicates that it's a string template
			_template = name.substring(1);
		}
		else{
			monster.pub('monster.requestStart');

			$.ajax({
				url: app.appPath + '/views/' + name + '.html',
				dataType: 'text',
				async: false,
				success: function(result){
					_template = result;
					monster.pub('monster.requestEnd');
				},
				error: function(xhr, status, err){
					_template = status + ': ' + err;
					monster.pub('monster.requestEnd');
				}
			});
		}

		_template = Handlebars.compile(_template);
		monster.cache.templates[app.name][name] = _template;
	}

	return _template;
}