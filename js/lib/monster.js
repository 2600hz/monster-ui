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

		_fileExists: function(url, success, error) {
			$.ajax({
				url: url,
				type:'HEAD',
				error: function(status) {
					error && error();
				},
				success: function(status) {
					success && success();
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
                        if (request.hasOwnProperty('removeHeaders')) {
                               request.removeHeaders = $.map(request.removeHeaders, function(n,i){return n.toLowerCase();});
                        }
			var self = this,
				// If an apiRoot is defined, force it, otherwise takes either the apiUrl of the app, or the default api url
				apiUrl = request.apiRoot ? request.apiRoot : (app.apiUrl ? app.apiUrl : this.config.api.default),
				hasRemoveHeaders = request.hasOwnProperty('removeHeaders'),
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

						if (!hasRemoveHeaders || (hasRemoveHeaders && request.removeHeaders.indexOf('x-auth-token') < 0)) {
							ampXHR.setRequestHeader('X-Auth-Token', app.authToken);
						}

						_.each(request.headers, function(val, key) {
                                                        if (!hasRemoveHeaders || request.removeHeaders.indexOf(key.toLowerCase()) < 0) {
                                                                ampXHR.setRequestHeader(key, val);
                                                        }
						});

						return true;
					}
				};

			if (hasRemoveHeaders) {
				if (request.removeHeaders.indexOf('content-type') > -1) {
					delete settings.contentType;
				}
			}

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

			settings.url = settings.url.replace(rurlData, function (m, key) {
				if (key in data) {
					mappedKeys.push(key);
					return data[key];
				}
			});

			settings.error = function requestError (error, one, two, three) {
				var parsedError = error;

				monster.pub('monster.requestEnd');

				if('response' in error && error.response) {
					parsedError = $.parseJSON(error.response);
				}

				if(error.status === 402 && typeof options.acceptCharges === 'undefined') {
					monster.ui.charges(parsedError.data, function() {
						options.acceptCharges = true;
						monster.request(options);
					}, function () {
						options.onChargesCancelled && options.onChargesCancelled();
					});
				}
				// If we have a 401 after being logged in, it means our session expired
				else if(monster.util.isLoggedIn() && error.status === 401) {
					// We don't want to show the normal error box for 401s, but still want to check the payload if they happen, via the error tool.
					monster.error('api', error, false);

					var isUsingKazooApi = settings.url.indexOf(monster.config.api.default) > -1;

					if (isUsingKazooApi) {
						monster.ui.alert('error', monster.apps.core.i18n.active().invalidCredentialsMessage, function() {
							monster.util.logoutAndReload();
						});
					}
					else {
						monster.ui.alert('error', monster.apps.core.i18n.active().authenticationIssue);
					}
				}
				else {
					// Added this to be able to display more data in the UI
					error.monsterData = {
						url: settings.url,
						verb: settings.method
					}

					monster.error('api', error, settings.customFlags.generateError);
				}

				options.error && options.error(parsedError, error);
			};

			settings.success = function requestSuccess (resp) {
				monster.pub('monster.requestEnd');

				options.success && options.success(resp);
			};

			// We delete the keys later so duplicates are still replaced
			_.each(mappedKeys, function (name, index) {
				delete data[name];
			});

			if(settings.method.toLowerCase() !== 'get'){
				var postData = data.data,
					envelopeKeys = {};

				if(data.hasOwnProperty('envelopeKeys')) {
					var protectedKeys = ['data', 'accept_charges'];

					_.each(data.envelopeKeys, function(value, key) {
						if(protectedKeys.indexOf(key) < 0) {
							envelopeKeys[key] = value
						}
					});
				}

				if(settings.contentType === 'application/json') {
					var payload = $.extend(true, {
						data: data.data || {}
					}, envelopeKeys);

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

		logs: {
			error: []
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

		template: function(app, name, data, raw, ignoreCache, ignoreSpaces){
			var raw = raw || false,
				ignoreCache = ignoreCache || false,
				ignoreSpaces = ignoreSpaces || false,
				conical = (app.name || 'global') + '.' + name, // this should always be a module instance
				_template,
				result;

			if(monster.cache.templates[conical] && !ignoreCache){
				_template = monster.cache.templates[conical];
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
			}

			monster.cache.templates[conical] = _template;

			if(!raw){
				_template = handlebars.compile(_template);

				var i18n = app.i18n.active();

				i18n._whitelabel = monster.config.whitelabel;

				var context = _.extend({}, data || {}, { i18n: i18n });

				result = _template(context);
			}
			else{
				result = _template;
			}

			if(!ignoreSpaces) {
				result = result.replace(/(\r\n|\n|\r|\t)/gm,'')
							   .trim();
			}

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

		formatMonsterAPIError: function(error) {
			var self = this,
				parsedError = error,
				isJsonResponse = error.hasOwnProperty('getResponseHeader') && error.getResponseHeader('content-type') === 'application/json';

			if('responseText' in error && error.responseText && isJsonResponse) {
				parsedError = $.parseJSON(error.responseText);
			}
			
			var errorsI18n = monster.apps.core.i18n.active().errors,
				errorMessage = errorsI18n.generic,
				errorNumber = error.status > 0 ? error.status : parseInt(error.error),
				customTitle;

			if(typeof parsedError.data === 'string' && typeof parsedError.message === 'string' && errorsI18n.errorMessages.hasOwnProperty(parsedError.message)) {
				errorMessage = errorsI18n.errorMessages[parsedError.message].text;
				customTitle = errorsI18n.errorMessages[parsedError.message].title;
			}
			else if(errorNumber === 400 && 'data' in parsedError) {
				errorMessage = errorsI18n.invalidData.errorLabel;
				_.each(parsedError.data, function(fieldErrors, fieldKey) {
					_.each(fieldErrors, function(fieldError, fieldErrorKey) {
						if(typeof fieldError === 'string') {
							errorMessage += '<br/>"' + fieldKey + '": ' + fieldError;
						} else if(fieldErrorKey in errorsI18n.invalidData) {
							errorMessage += '<br/>' + monster.template(monster.apps.core, '!' + errorsI18n.invalidData[fieldErrorKey], { field: fieldKey, value: fieldError.target });
						} else if('message' in fieldError) {
							errorMessage += '<br/>"' + fieldKey + '": ' + fieldError.message;
						}
					});
				});
			} else if((errorNumber === 409 || errorNumber === 500) && 'data' in parsedError) {
				var errMsg = '';

				_.each(parsedError.data, function(fieldError, fieldErrorKey) {
					if(fieldErrorKey in errorsI18n.errorMessages) {
						errMsg += errorsI18n.errorMessages[fieldErrorKey].text + '<br>';
					} else if(fieldError.hasOwnProperty('message')) {
						errMsg += fieldError.message + '<br>';
					}
				});

				if(errMsg) { 
					errorMessage = errMsg;
				}
			} else if(errorsI18n.hasOwnProperty(errorNumber)) {
				errorMessage = errorsI18n[errorNumber];
			}

			var requestId = '',
				url = '',
				verb = '';

			if(parsedError.hasOwnProperty('request_id')) {
				requestId = parsedError.request_id;
			}

			if(error.hasOwnProperty('monsterData')) {
				url = error.monsterData.url;
				verb = error.monsterData.verb;
			}

			return {
				status: error.status,
				message: errorMessage,
				requestId: requestId || '',
				response: (error.hasOwnProperty('responseText') && isJsonResponse) ? JSON.stringify($.parseJSON(error.responseText), null, 4) : JSON.stringify(error, null, 4),
				url: url || '',
				verb: verb || '',
				customTitle: customTitle
			};
		},

		error: function(type, data, showDialog) {
			var self = this,
				showDialog = showDialog === false ? false : true,
				monsterError = {
					type: type,
					timestamp: new Date(),
					data: {}
				};

			if(type === 'api') {
				monsterError.data = self.formatMonsterAPIError(data);

				if(showDialog) {
					monster.ui.requestErrorDialog(monsterError);
				}
			}
			else if(type === 'js') {
				monsterError.data = {
					title: data.message,
					file: data.fileName,
					line: data.lineNumber,
					column: data.columnNumber,
					stackTrace: data.error && data.error.hasOwnProperty('stack') ? data.error.stack : ''
				}

				if(monster.config.hasOwnProperty('developerFlags') && monster.config.developerFlags.showJSErrors && showDialog) {
					monster.ui.jsErrorDialog(monsterError);
				}
			}

			monster.logs.error.push(monsterError);
		},

		parallel: function(methods, callback, pLimit) {
			var limit = pLimit && pLimit >= 1 ? pLimit : 5;

			async.parallelLimit(methods, limit, function(err, results) {
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
					version = version.replace(/\n.*/g,'')
					                 .trim();

					callback(version);
				}
			});
		},

		getScript: function(url, callback) {
			var self = this;

			$.getScript(url, callback);
		},

		querystring: function (key) {
			var re = new RegExp('(?:\\?|&)' + key + '=(.*?)(?=&|$)', 'gi'),
				results = [],
				match;
			while ((match = re.exec(document.location.search)) != null){
				results.push(match[1]);
			}
			return results.length ? results[0] : null;
		},

		initSDK: function() {
			var self = this;

			self.kazooSdk = $.getKazooSdk(
				{
					apiRoot: monster.config.api.default,
					onRequestStart: function(request, requestOptions) {
						monster.pub('monster.requestStart');
					},
					onRequestEnd: function(request, requestOptions) {
						monster.pub('monster.requestEnd');
					},
					onRequestError: function(error, requestOptions) {
						var parsedError = error;
						if('responseText' in error && error.responseText && error.getResponseHeader('content-type') === 'application/json') {
							parsedError = $.parseJSON(error.responseText);
						}

						if(error.status === 402 && typeof requestOptions.acceptCharges === 'undefined') {
							var parsedError = error;
							if('responseText' in error && error.responseText) {
								parsedError = $.parseJSON(error.responseText);
							}

							monster.ui.charges(parsedError.data, function() {
								requestOptions.acceptCharges = true;
								monster.kazooSdk.request(requestOptions);
							}, function () {
								requestOptions.onChargesCancelled && requestOptions.onChargesCancelled();
							});
						}
						// If we have a 401 after being logged in, it means our session expired
						else if(monster.util.isLoggedIn() && error.status === 401) {
							// We don't want to show the normal error box for 401s, but still want to check the payload if they happen, via the error tool.
							monster.error('api', error, false);

							monster.ui.alert('error', monster.apps.core.i18n.active().invalidCredentialsMessage, function() {
								monster.util.logoutAndReload();
							});
						}
						else {
							monster.error('api', error, requestOptions.generateError);
						}
					}
				}
			);
		}
	};

	// We added this so Google Maps could execute a callback in the global namespace
	// See example in Cluster Manager
	window.monster = monster;

	return monster;
});
