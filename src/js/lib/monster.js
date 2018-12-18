define(function(require) {
	var $ = require('jquery'),
		_ = require('lodash'),
		async = require('async'),
		card = require('card'),
		Cookies = require('cookies'),
		ddslick = require('ddslick'),
		fileupload = require('fileupload'),
		form2object = require('form2object'),
		handlebars = require('handlebars'),
		kazoosdk = require('kazoosdk'),
		md5 = require('md5'),
		postal = require('postal'),
		reqwest = require('reqwest');

	var _privateFlags = {
		lockRetryAttempt: false,
		retryFunctions: [],
		unlockRetryFunctions: function() {
			console.log(this.retryFunctions);
			_.each(this.retryFunctions, function(fun) {
				fun();
			});

			this.lockRetryAttempt = false;
			this.retryFunctions = [];
		},
		addRetryFunction: function(fun) {
			this.retryFunctions.push(fun);
		}
	};

	var monster = {
		_channel: postal.channel('monster'),

		_fileExists: function(url, success, error) {
			$.ajax({
				url: url,
				type: 'HEAD',
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
			if (request.cache || request.method.toLowerCase() !== 'get') {
				return '';
			}

			var prepend = request.url.indexOf('?') >= 0 ? '&' : '?';

			return prepend + '_=' + (new Date()).getTime();
		},

		_defineRequest: function(id, request, app) {
			if (request.hasOwnProperty('removeHeaders')) {
				request.removeHeaders = $.map(request.removeHeaders, function(header) { return header.toLowerCase(); });
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
							ampXHR.setRequestHeader('X-Auth-Token', app.getAuthToken());
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

		request: function(options) {
			var self = this,
				settings = _.extend({}, this._requests[options.resource]);

			if (!settings) {
				throw new Error('The resource requested could not be found.', options.resource);
			}

			settings.url = options.apiUrl || settings.url;

			if (options.data && 'filters' in options.data) {
				$.each(options.data.filters, function(filterKey, filterValue) {
					var valueArray = [].concat(filterValue);
					$.each(valueArray, function(key, value) {
						settings.url += (settings.url.indexOf('?') > 0 ? '&' : '?') + filterKey + '=' + value;
					});
				});
			}

			settings.url += self._cacheString(settings);

			var mappedKeys = [],
				rurlData = /\{([^}]+)\}/g,
				data = _.extend({}, options.data || {});

			settings.url = settings.url.replace(rurlData, function(v, key) {
				if (key in data) {
					mappedKeys.push(key);
					return data[key];
				}
			});

			settings.error = function requestError(error) {
				var parsedError,
					handleError = function(error, options) {
						parsedError = error;

						var generateError = options && options.hasOwnProperty('generateError') ? options.generateError : settings.customFlags.generateError;

						monster.pub('monster.requestEnd');

						if ('response' in error && error.response) {
							parsedError = $.parseJSON(error.response);
						}

						// If we have a 401 after being logged in, it means our session expired
						if (monster.util.isLoggedIn() && error.status === 401) {
							// We don't want to show the normal error box for 401s, but still want to check the payload if they happen, via the error tool.
							monster.error('api', error, false);

							monster.ui.alert('error', monster.apps.core.i18n.active().authenticationIssue);
						} else {
							// Added this to be able to display more data in the UI
							error.monsterData = {
								url: settings.url,
								verb: settings.method
							};

							monster.error('api', error, generateError);
						}
					};

				handleError(error);

				options.error && options.error(parsedError, error, handleError);
			};

			settings.success = function requestSuccess(resp) {
				monster.pub('monster.requestEnd');

				options.success && options.success(resp);
			};

			// We delete the keys later so duplicates are still replaced
			_.each(mappedKeys, function(name, index) {
				delete data[name];
			});

			if (settings.method.toLowerCase() !== 'get') {
				var postData = data.data,
					envelopeKeys = {};

				if (data.hasOwnProperty('envelopeKeys')) {
					var protectedKeys = ['data', 'accept_charges'];

					_.each(data.envelopeKeys, function(value, key) {
						if (protectedKeys.indexOf(key) < 0) {
							envelopeKeys[key] = value;
						}
					});
				}

				if (settings.contentType === 'application/json') {
					var payload = $.extend(true, {
						data: data.data || {}
					}, envelopeKeys);

					if (!data.hasOwnProperty('removeMetadataAPI') || data.removeMetadataAPI === false) {
						payload.data.ui_metadata = {
							version: monster.util.getVersion(),
							ui: 'monster-ui'
						};
					}

					if (options.acceptCharges === true) {
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

		config: (function(config) {
			var getValue = function(node, key, check, preset) {
				return node.hasOwnProperty(key) && check(node[key])
					? node[key]
					: preset;
			};
			config.api = getValue(config, 'api', _.isObject, {});
			config.api.default = getValue(config.api, 'default', _.isString, window.location.protocol + '//' + window.location.hostname + ':8000/v2/');
			config.currencyCode = getValue(config, 'currencyCode', _.isString, 'USD');
			config.whitelabel = getValue(config, 'whitelabel', _.isObject, {});
			config.whitelabel.disableNumbersFeatures = getValue(config.whitelabel, 'disableNumbersFeatures', _.isBoolean, false);
			config.developerFlags = getValue(config, 'developerFlags', _.isObject, {});
			return config;
		}(require('config'))),

		cookies: {
			set: function set(key, value, options) {
				Cookies.set(key, value, options);
			},

			get: function get(key) {
				return this.has(key) ? Cookies.get(key) : null;
			},

			getJson: function getJson(key) {
				return this.has(key) ? Cookies.getJSON(key) : null;
			},

			remove: function remove(key) {
				Cookies.remove(key);
			},

			has: function has(key) {
				return Cookies.get(key) === undefined ? false : true;
			}
		},

		css: function(href) {
			$('<link/>', { rel: 'stylesheet', href: monster.util.cacheUrl(href) }).appendTo('head');
		},

		domain: function() {
			var matches = location.href.match(/^(?:https?:\/\/)*([^/?#]+).*$/);
			return matches.length > 1 ? matches[1] : '';
		},

		pub: function(topic, data) {
			postal.publish({
				channel: 'monster',
				topic: topic,
				data: data || {}
			});
		},

		sub: function(topic, callback, context) {
			if (typeof callback === 'undefined') {
				console.warn('The topic ' + topic + ' does not have a callback');
			} else {
				var sub = this._channel.subscribe(topic, callback);
				if (context) {
					sub.context(context);
				}

				return sub;
			}
		},

		unsub: function(subscription) {
			subscription.unsubscribe();
		},

		getTemplate: function(args) {
			var self = this,
				data = args.data || {},
				raw = args.hasOwnProperty('raw') ? args.raw : false,
				ignoreCache = args.hasOwnProperty('ignoreCache') ? args.ignoreCache : false,
				ignoreSpaces = args.hasOwnProperty('ignoreSpaces') ? args.ignoreSpaces : false,
				submodule = args.hasOwnProperty('submodule') ? args.submodule : 'main',
				_template = Handlebars.getTemplate(args.app, submodule, args.name, ignoreCache),
				result = self.getFormattedTemplate(_template, args.app, args.name, data, raw, ignoreSpaces);

			return result;
		},

		template: function(app, name, data, raw, ignoreCache, ignoreSpaces) {
			var self = this,
				raw = raw || false,
				ignoreCache = ignoreCache || false,
				ignoreSpaces = ignoreSpaces || false,
				_template = Handlebars.getTemplate(app, 'main', name, ignoreCache),
				result = self.getFormattedTemplate(_template, app, name, data, raw, ignoreSpaces);

			return result;
		},

		getFormattedTemplate: function(_template, app, name, data, raw, ignoreSpaces) {
			var self = this,
				result;

			if (!raw) {
				var i18n = app.i18n.active();

				var context = _.extend({}, data || {}, { i18n: i18n, _whitelabel: monster.config.whitelabel });

				result = _template(context);
			} else {
				result = _template;
			}

			if (!ignoreSpaces) {
				result = result.replace(/(\r\n|\n|\r|\t)/gm, '').trim();
			}

			if (name.substring(0, 1) !== '!') {
				result = monster.util.updateImagePath(result, app);
			}

			return result;
		},

		formatMonsterAPIError: function(error) {
			var self = this,
				parsedError = error,
				isParsable = error.hasOwnProperty('getResponseHeader') ? (error.getResponseHeader('content-type') === 'application/json') : typeof error === 'object' && 'responseText' in error;// for unknown reason hasOwnProperty returns false?

			isParsable = isParsable && error.responseText !== '';

			if (isParsable) {
				parsedError = $.parseJSON(error.responseText);
			}

			var errorsI18n = monster.apps.core.i18n.active().errors,
				errorMessage = errorsI18n.generic,
				errorNumber = error.status > 0 ? error.status : parseInt(error.error),
				customTitle;

			if (typeof parsedError.data === 'string' && typeof parsedError.message === 'string' && errorsI18n.errorMessages.hasOwnProperty(parsedError.message)) {
				errorMessage = errorsI18n.errorMessages[parsedError.message].text;
				customTitle = errorsI18n.errorMessages[parsedError.message].title;
			} else if ((errorNumber === 400 || errorNumber === 413) && 'data' in parsedError) {
				errorMessage = errorsI18n.invalidData.errorLabel;
				_.each(parsedError.data, function(fieldErrors, fieldKey) {
					if (typeof fieldErrors === 'string') {
						return;
					}

					_.each(fieldErrors, function(fieldError, fieldErrorKey) {
						if (typeof fieldError === 'string' || typeof fieldError === 'number') {
							errorMessage += '<br/>"' + fieldKey + '": ' + fieldError;
						} else if (fieldErrorKey in errorsI18n.invalidData) {
							errorMessage += '<br/>' + monster.template(monster.apps.core, '!' + errorsI18n.invalidData[fieldErrorKey], { field: fieldKey, value: fieldError.target });
						} else if ('message' in fieldError) {
							errorMessage += '<br/>"' + fieldKey + '": ' + fieldError.message;
						}
					});
				});
			} else if ((errorNumber === 409 || errorNumber === 500) && 'data' in parsedError) {
				var errMsg = '';

				_.each(parsedError.data, function(fieldError, fieldErrorKey) {
					if (fieldErrorKey in errorsI18n.errorMessages) {
						errMsg += errorsI18n.errorMessages[fieldErrorKey].text + '<br>';
					} else if (fieldError.hasOwnProperty('message')) {
						errMsg += fieldError.message + '<br>';
					}
				});

				if (errMsg) {
					errorMessage = errMsg;
				}
			} else if (errorsI18n.hasOwnProperty(errorNumber)) {
				errorMessage = errorsI18n[errorNumber];
			}

			var requestId = '',
				url = '',
				verb = '';

			if (parsedError.hasOwnProperty('request_id')) {
				requestId = parsedError.request_id;
			}

			if (error.hasOwnProperty('monsterData')) {
				url = error.monsterData.url;
				verb = error.monsterData.verb;
			}

			return {
				status: error.status,
				message: errorMessage,
				requestId: requestId || '',
				response: isParsable ? JSON.stringify($.parseJSON(error.responseText), null, 4) : JSON.stringify(error, null, 4),
				url: url || '',
				verb: verb || '',
				customTitle: customTitle,
				jsonResponse: isParsable ? $.parseJSON(error.responseText) : error
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

			if (type === 'api') {
				monsterError.data = self.formatMonsterAPIError(data);
				if (showDialog) {
					monster.ui.requestErrorDialog(monsterError);
				}
			} else if (type === 'js') {
				monsterError.data = {
					title: data.message,
					file: data.fileName,
					line: data.lineNumber,
					column: data.columnNumber,
					stackTrace: data.error && data.error.hasOwnProperty('stack') ? data.error.stack : ''
				};

				if (monster.config.hasOwnProperty('developerFlags') && monster.config.developerFlags.showJSErrors && showDialog) {
					monster.ui.jsErrorDialog(monsterError);
				}
			}

			monster.logs.error.push(monsterError);
		},

		parallel: function(tasks, callback, pLimit) {
			var limit = pLimit && pLimit >= 1 ? pLimit : 5;

			async.parallelLimit(tasks, limit, callback);
		},

		series: async.series,
		waterfall: async.waterfall,

		shift: function(chain) {
			var next = chain.shift();
			next && next();
		},

		loadBuildConfig: function(globalCallback) {
			var self = this;

			monster.parallel({
				version: function(callback) {
					$.ajax({
						url: 'VERSION',
						cache: false,
						success: function(version) {
							version = version.replace(/\n.*/g, '').trim();

							callback(null, version);
						},
						error: function() {
							callback(null, null);
						}
					});
				},
				buildFile: function(callback) {
					$.ajax({
						url: 'build-config.json',
						dataType: 'json',
						cache: false,
						success: function(config) {
							callback(null, config);
						},
						error: function() {
							callback(null, {});
						}
					});
				}
			}, function(err, results) {
				monster.config.developerFlags.build = results.buildFile;
				monster.config.developerFlags.build.version = results.version;

				globalCallback && globalCallback(monster.config.developerFlags.build);
			});
		},

		getScript: function(url, callback) {
			var self = this;

			$.getScript(url, callback);
		},

		querystring: function(key) {
			var re = new RegExp('(?:\\?|&)' + key + '=(.*?)(?=&|$)', 'gi'),
				results = [],
				match;
			while ((match = re.exec(document.location.search)) != null) {
				results.push(match[1]);
			}
			return results.length ? results[0] : null;
		},

		initSDK: function() {
			var self = this;

			self.kazooSdk = $.getKazooSdk({
				apiRoot: monster.config.api.default,
				onRequestStart: function(request, requestOptions) {
					monster.pub('monster.requestStart');
				},
				onRequestEnd: function(request, requestOptions) {
					monster.pub('monster.requestEnd');
				},
				onRequestError: function(error, requestOptions) {
					var parsedError = error,
						requestOptions = requestOptions || { generateError: true };

					if ('responseText' in error && error.responseText && error.getResponseHeader('content-type') === 'application/json') {
						parsedError = $.parseJSON(error.responseText);
					}

					if (error.status === 402) {
						// Handle the "Payment Required" status

						// If we have a 402 after the charges have been accepted/rejected,
						// handle the error callback as required originally
						if (typeof requestOptions.acceptCharges !== 'undefined') {
							requestOptions.preventCallbackError = requestOptions.originalPreventCallbackError;
							return;
						}

						// Else, handle the charges notification here
						var parsedError = error;

						if ('responseText' in error && error.responseText) {
							parsedError = $.parseJSON(error.responseText);
						}

						// Store current preventCallbackError value...
						requestOptions.originalPreventCallbackError = requestOptions.preventCallbackError;

						// ...and prevent the execution of the custom error callback, as it is a
						// charges notification that will be handled here
						requestOptions.preventCallbackError = true;

						// Notify the user about the charges
						monster.ui.charges(parsedError.data, function() {
							requestOptions.acceptCharges = true;
							monster.kazooSdk.request(requestOptions);
						}, function() {
							requestOptions.onChargesCancelled && requestOptions.onChargesCancelled();
						});
					} else if (monster.util.isLoggedIn() && error.status === 401) {
						// If we have a 401 after being logged in, it means our session expired, or that it's a MFA denial of the relogin attempt
						// We don't want to show the normal error box for 401s, but still want to check the payload if they happen, via the error tool.
						monster.error('api', error, false);

						// the prevent callback error key is added by our code. We want to let the system automatically attempt to relogin once before sending the error callback
						// So to prevent the original error callback from being fired, we add that flag to the request when we attempt the request a second time
						if (!requestOptions.hasOwnProperty('preventCallbackError') || requestOptions.preventCallbackError === false) {
							// If it's a retryLoginRequest, we don't want to prevent the callback as it could be a MFA denial
							if (!requestOptions.hasOwnProperty('isRetryLoginRequest') || requestOptions.isRetryLoginRequest === false) {
								if (!_privateFlags.lockRetryAttempt) {
									// We added a new locking mechanism. Basically if your module use a parallel request, you could have 5 requests ending in a 401. We don't want to automatically re-login 5 times, so we lock the system
									// Once the re-login is effective, we'll unlock it.
									_privateFlags.lockRetryAttempt = true;

									// Because onRequestError is executed before error in the JS SDK, we can set this flag to prevent the execution of the custom error callback
									// This way we can handle the 401 properly, try again with a new auth token, and continue the normal flow of the ui
									requestOptions.preventCallbackError = true;

									monster.apps.auth.retryLogin({ isRetryLoginRequest: true }, function(newToken) {
										// We setup the flag to false this time, so that if it errors out again, we properly log out of the UI
										var updatedRequestOptions = $.extend(true, requestOptions, { preventCallbackError: false, authToken: newToken });

										monster.kazooSdk.request(updatedRequestOptions);

										_privateFlags.unlockRetryFunctions();
									},
									function() {
										monster.ui.alert('error', monster.apps.core.i18n.active().invalidCredentialsMessage, function() {
											monster.util.logoutAndReload();
										});
									});
								} else {
									_privateFlags.addRetryFunction(function() {
										var updatedRequestOptions = $.extend(true, requestOptions, { authToken: monster.util.getAuthToken() });

										monster.kazooSdk.request(updatedRequestOptions);
									});
								}
							}
						} else {
							monster.ui.alert('error', monster.apps.core.i18n.active().invalidCredentialsMessage, function() {
								monster.util.logoutAndReload();
							});
						}
					} else {
						monster.error('api', error, requestOptions.generateError);
					}
				}
			});
		},

		hasProVersion: function(app) {
			var self = this;

			return monster.config.developerFlags.build.proApps.indexOf(app.name) >= 0;
		},

		md5: function(string) {
			return md5(string);
		}
	};

	// We added this so Google Maps could execute a callback in the global namespace
	// See example in Cluster Manager
	window.monster = monster;
	window.Handlebars = handlebars;

	return monster;
});
