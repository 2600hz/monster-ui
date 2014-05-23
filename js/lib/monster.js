define(function(require){
	var $ = require('jquery'),
		_ = require('underscore'),
		postal = require('postal'),
		reqwest = require('reqwest'),
		handlebars = require('handlebars'),
		async = require('async'),
		form2object = require('form2object'),
		config = require('config'),
		kazoosdk = require('kazoosdk');

	var monster = {
		_channel: postal.channel('monster'),

		// ping the server to see if a file exists. this is not an exhaustive or intensive operation.
		_fileExists: function(url){
			var http = new XMLHttpRequest();
			http.open('HEAD', url, false);
			http.send();
			return http.status != 404;
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
					customFlags: {
						generateError: request.generateError === false ? false : true
					},
					before: function(ampXHR, settings) {
						monster.pub('monster.requestStart');

						ampXHR.setRequestHeader('X-Auth-Token', app.authToken);
						_.each(request.headers, function(val, key) {
							ampXHR.setRequestHeader(key, val);
						});

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

			settings.url = options.apiUrl || settings.url;

			settings.url += self._cacheString(settings);

			var mappedKeys = [],
				rurlData = /\{([^\}]+)\}/g,
				data = _.extend({}, options.data || {});

			settings.error = function requestError (error, one, two, three) {
				monster.pub('monster.requestEnd');

				var parsedError = error;

				if('response' in error && error.response) {
					parsedError = $.parseJSON(error.response);
				}

				if(error.status === 402 && typeof options.acceptCharges === 'undefined') {
					monster.ui.charges(parsedError.data, function() {
						options.acceptCharges = true;
						monster.request(options);
					});
				} else {
					if(settings.customFlags.generateError) {
						var errorsI18n = monster.apps.core.i18n.active().errors,
							errorMessage = errorsI18n.generic;

						if(error.status in errorsI18n) {
							errorMessage = errorsI18n[error.status];
						}

						if(parsedError.message) {
							errorMessage += '<br/><br/>' + errorsI18n.genericLabel + ': ' + parsedError.message;
						}

						monster.ui.alert('error', errorMessage);
					}
				}

				options.error && options.error(parsedError, error);
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

			if(settings.method.toLowerCase() !== 'get'){
				var postData = data.data;

				if(settings.contentType === 'application/json') {
					var payload = {
						data: data.data
					};

					payload.data.ui_metadata = {
						version: monster.config.version,
						ui: 'monster-ui'
					};

					if(options.acceptCharges === true) {
						payload.accept_charges = true;
					}

					postData = JSON.stringify(payload);
				}

				settings = _.extend(settings, {
					data: postData
				});
			}

			return reqwest(settings);
		},

		apps: {},

		cache: {
			templates: {}
		},

		config: _.extend({
			api: {
				default: window.location.origin + ':8000/v2/',
			}
		}, config),

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

			if(name.substring(0,1) !== '!') {
				result = monster.util.updateImagePath(result, app);
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
				success: function(version) {
					version = version.replace(/[\n\s]/g,'')

					callback(version);
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
	}

	monster.kazooSdk = $.getKazooSdk({
		apiRoot: monster.config.api.default,
		onRequestStart: function(request, requestOptions) {
			monster.pub('monster.requestStart');
		},
		onRequestEnd: function(request, requestOptions) {
			monster.pub('monster.requestEnd');
		},
		onRequestError: function(error, requestOptions) {
			if(error.status === 402 && typeof options.acceptCharges === 'undefined') {
				monster.ui.charges(error.data, function() {
					options.acceptCharges = true;
					monster.kazooSdk.request(options);
				});
			} else {
				if(requestOptions.generateError !== false) {
					var errorsI18n = monster.apps.core.i18n.active().errors,
						errorMessage = errorsI18n.generic;

					if(error.status in errorsI18n) {
						errorMessage = errorsI18n[error.status];
					}

					if(error.message) {
						errorMessage += '<br/><br/>' + errorsI18n.genericLabel + ': ' + error.message;
					}

					monster.ui.alert('error', errorMessage);
				}
			}
		}
	});

	return monster;
});
