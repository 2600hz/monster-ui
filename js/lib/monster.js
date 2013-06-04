define(function(require){
	var $ = require('jquery'),
		_ = require('underscore'),
		postal = require('postal'),
		reqwest = require('reqwest'),
		handlebars = require('handlebars'),
		async = require('async'),
		form2object = require('form2object'),
		config = require('js/config');

	var monster = {
		_channel: postal.channel('monster'),

		// ping the server to see if a file exists. this is not an exhaustive or intensive operation.
		_fileExists: function(url){
			var http = new XMLHttpRequest();
			http.open('HEAD', url, false);
			http.send();
			return http.status != 404;
		},

		_loadApp: function(name, callback){
			var self = this,
				appPath = 'apps/' + name,
				path = appPath + '/app',
				css = path + '.css';

			require([path], function(app){
				_.extend(app, { appPath: '/' + appPath, data: {} }, monster.apps[name]);

				_.each(app.requests, function(request, id){
					self._defineRequest(id, request, app);
				});

				_.each(app.subscribe, function(callback, topic){
					var cb = typeof callback === 'string' ? app[callback] : callback;

					self.sub(topic, cb, app);
				});

				_.extend(app.data, { i18n: {} });

				_.each(app.i18n, function(locale){
					self._loadLocale(app, locale)
				});

				// add an active property method to the i18n array within the app.
				_.extend(app.i18n, {
					active: function(){
						return app.data.i18n[monster.config.i18n.active] || app.data.i18n['en-US'] || {}
					}
				});

				if(self._fileExists(css)){
					self.css(css);
				}

				monster.apps[name] = app;

				app.load(callback);
			})
		},

		_loadLocale: function(app, name){
			$.ajax({
				url: app.appPath + '/i18n/' + name + '.json',
				dataType: 'json',
				async: false,
				success: function(data){
					app.data.i18n[name] = data;
				},
				error: function(data, status, error){
					console.log('_loadLocale error: ', status, error);
				}
			});
		},

		_requests: {},

		_cacheString: function(request) {
			if(request.cache || request.method.toLowerCase() !== 'get') {
				return '';
			}

			var prepend = request.url.indexOf('?') >= 0 ? '&' : '?';

			return prepend + '_=' + (new Date()).getTime();
		},

		_defineRequest: function(id, request, app){
			var self = this,
				apiUrl = app.apiUrl ? app.apiUrl : (request.apiRoot || this.config.api.default),
				settings = {
					cache: request.cache || false,
					url: apiUrl + request.url,
					type: request.dataType || 'json',
					method: request.verb || 'get',
					contentType: request.type || 'application/json',
					crossOrigin: true,
					processData: false,
					before: function(ampXHR, settings) {
						monster.pub('monster.requestStart');

						ampXHR.setRequestHeader('X-Auth-Token', app.authToken);

						return true;
					}
				};

			this._requests[id] = settings;
		},

		request: function(options){
			var self = this,
				settings =  _.extend({}, this._requests[options.resource]);

			if(!settings){
				throw('The resource requested could not be found.', options.resource);
			}

			settings.url += self._cacheString(settings);

			var mappedKeys = [],
				rurlData = /\{([^\}]+)\}/g,
				data = _.extend({}, options.data || {});

			settings.error = function requestError (error, one, two, three) {
				//console.warn('reqwest failure on: ' + options.resource, error)
				monster.pub('monster.requestEnd');

				options.error && options.error(error);
			};

			settings.success = function requestSuccess (resp) {
				monster.pub('monster.requestEnd');

				options.success && options.success(resp);
			};

			settings.url = settings.url.replace(rurlData, function (m, key) {
				if (key in data) {
					mappedKeys.push(key);
					return data[key];
				}
			});

			// We delete the keys later so duplicates are still replaced
			_.each(mappedKeys, function (name, index) {
				delete data[name];
			});

			var postData = {
				data: data.data
			};

			if(settings.method.toLowerCase() !== 'get'){
				settings = _.extend(settings, {
					data: JSON.stringify(postData)
				});
			}

			return reqwest(settings);
		},

		apps: {},

		cache: {
			templates: {}
		},

		config: _.extend({}, config),

		css: function(href){
			$('<link/>', { rel: 'stylesheet', href: href }).appendTo('head');
		},

		domain: function(){
			var matches = location.href.match(/^(?:https?:\/\/)*([^\/?#]+).*$/);
			return matches.length > 1 ? matches[1] : '';
		},

		pub: function(topic, data){
			postal.publish({
				channel: 'monster',
				topic: topic,
				data: data || {}
			});
		},

		sub: function(topic, callback, context){
			var sub = this._channel.subscribe(topic, callback);

			if(context){
				sub.withContext(context);
			}
		},

		template: function(app, name, data, raw, ignoreCache){
			raw = raw || false;
			ignoreCache = ignoreCache || false;

			var conical = (app.name || 'global') + '.' + name, // this should always be a module instance
				_template,
				result;

			if(monster.cache.templates[conical] && !ignoreCache){
				_template = monster.cache.templates[conical];
			}
			else {
				if(name.substring(0, 1) === '!'){ // ! indicates that it's a string template
					_template = name.substring(1);
				}
				else if($(name).length){ // template is in the dom. eg. <script type='text/html' />
					_template = $(name).html();
				}
				else{
					$.ajax({
						url: app.appPath + '/views/' + name + '.html',
						dataType: 'text',
						async: false,
						success: function(result){
							_template = result;
						},
						error: function(xhr, status, err){
							_template = status + ': ' + err;
						}
					});
				}
			}

			monster.cache.templates[conical] = _template;

			if(!raw){
				_template = handlebars.compile(_template);

				var i18n = app.i18n.active(),
				context = _.extend({}, data || {}, { i18n: i18n });

				result = _template(context);
			}
			else{
				result = _template;
			}

			result = result.replace(/(\r\n|\n|\r|\t)/gm,'');

			if(typeof data === 'object') {
				_.each(data.i18n, function(value, key) {
					result = result.replace('{{'+ key +'}}', value);
				});
			}

			return result;
		},

		parallel: function(methods, callback) {
			async.parallel(methods, function(err, results) {
				callback(err, results);
			});
		},

		shift: function(chain){
			var next = chain.shift();
			next && next();
		},

		getVersion: function(callback) {
			$.ajax({
				url: 'VERSION',
				cache: false,
				success: function(template) {
					callback(template);
				}
			});
		},

		querystring: function (key) {
			var re = new RegExp('(?:\\?|&)' + key + '=(.*?)(?=&|$)', 'gi'),
				results = [],
				match;
			while ((match = re.exec(document.location.search)) != null){
				results.push(match[1]);
			}
			return results.length ? results[0] : null;
		}
	};

	return monster;
});
