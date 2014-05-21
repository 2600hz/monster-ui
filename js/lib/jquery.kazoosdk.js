(function ( $ ) {
	var baseMethods = {
		auth: {
			userAuth: function(settings) {
				authFunction(settings, this.parent.defaultSettings, 'user_auth');
			},
			sharedAuth: function(settings) {
				authFunction(settings, this.parent.defaultSettings, 'shared_auth');
			},
			pinAuth: function(settings) {
				authFunction(settings, this.parent.defaultSettings, 'pin_auth');
			}
		}
	},
	methodsGenerator = {
		account: {
			'get': { verb: 'GET', url: 'accounts/{accountId}' },
			'create': { verb: 'PUT', url: 'accounts/{accountId}' },
			'update': { verb: 'POST', url: 'accounts/{accountId}' },
			'delete': { verb: 'DELETE', url: 'accounts/{accountId}' },
			'descendants': { verb: 'GET', url: 'accounts/{accountId}/descendants' }
		},
		user: {
			'get': { verb: 'GET', url: 'accounts/{accountId}/users/{userId}' },
			'create': { verb: 'PUT', url: 'accounts/{accountId}/users' },
			'update': { verb: 'POST', url: 'accounts/{accountId}/users/{userId}' },
			'delete': { verb: 'DELETE', url: 'accounts/{accountId}/users/{userId}' },
			'list': { verb: 'GET', url: 'accounts/{accountId}/users' }
		},
		group: {
			'get': { verb: 'GET', url: 'accounts/{accountId}/groups/{groupId}' },
			'create': { verb: 'PUT', url: 'accounts/{accountId}/groups' },
			'update': { verb: 'POST', url: 'accounts/{accountId}/groups/{groupId}' },
			'delete': { verb: 'DELETE', url: 'accounts/{accountId}/groups/{groupId}' },
			'list': { verb: 'GET', url: 'accounts/{accountId}/groups' }
		},
		callflow: {
			'get': { verb: 'GET', url: 'accounts/{accountId}/callflows/{callflowId}' },
			'create': { verb: 'PUT', url: 'accounts/{accountId}/callflows' },
			'update': { verb: 'POST', url: 'accounts/{accountId}/callflows/{callflowId}' },
			'delete': { verb: 'DELETE', url: 'accounts/{accountId}/callflows/{callflowId}' },
			'list': { verb: 'GET', url: 'accounts/{accountId}/callflows' }
		},
		media: {
			'get': { verb: 'GET', url: 'accounts/{accountId}/medias/{mediaId}' },
			'create': { verb: 'PUT', url: 'accounts/{accountId}/medias' },
			'update': { verb: 'POST', url: 'accounts/{accountId}/medias/{mediaId}' },
			'delete': { verb: 'DELETE', url: 'accounts/{accountId}/medias/{mediaId}' },
			'list': { verb: 'GET', url: 'accounts/{accountId}/medias' }
		},
		voicemail: {
			'get': { verb: 'GET', url: 'accounts/{accountId}/vmboxes/{voicemailId}' },
			'create': { verb: 'PUT', url: 'accounts/{accountId}/vmboxes' },
			'update': { verb: 'POST', url: 'accounts/{accountId}/vmboxes/{voicemailId}' },
			'delete': { verb: 'DELETE', url: 'accounts/{accountId}/vmboxes/{voicemailId}' },
			'list': { verb: 'GET', url: 'accounts/{accountId}/vmboxes' }
		}
	},
	authTokens = {};

	/* Available settings:
	 * - apiRoot: [REQUIRED]
	 * - onRequestStart: [OPTIONAL]
	 * - onRequestEnd: [OPTIONAL]
	 * - onRequestSuccess: [OPTIONAL]
	 * - onRequestError: [OPTIONAL]
	 * - uiMetadata: [OPTIONAL]
	 * - authToken: [OPTIONAL]
	**/
	$.getKazooSdk = function(settings) {
		if(settings && typeof settings === 'string') { settings = { apiRoot: settings }; }
		if(settings && settings.apiRoot) {
			var sdkMethods = $.extend({}, baseMethods);
			$.each(sdkMethods, function() {
				if(typeof this === 'object') { this.parent = sdkMethods; }
			});
			sdkMethods.defaultSettings = settings;

			if('authToken' in settings && settings.authToken.length > 0) {
				authTokens[settings.apiRoot] = authToken;
			}

			$.each(methodsGenerator, function(group, methods) {
				if(!(group in sdkMethods)) { sdkMethods[group] = {}; }
				$.each(methods, function(methodName, methodInfo) {
					sdkMethods[group][methodName] = function(methodSettings) {
						var self = this,
							methodSettings = methodSettings || {},
							requestSettings = {
								url: (methodSettings.apiRoot || settings.apiRoot) + methodInfo.url,
								verb: methodInfo.verb,
								data: {}
							},
							ids = $.map(methodInfo.url.match(/\{([^\}]+)\}/g) || [], function(v) { return v.replace(/\{|\}/g, ''); });

						if(methodInfo.verb.toLowerCase() === 'delete') {
							requestSettings.data.data = {};
						} else if(methodInfo.verb.toLowerCase() === 'post' || methodInfo.verb.toLowerCase() === 'put') {
							requestSettings.data.data = methodSettings.data;
							delete methodSettings.data;
						}

						$.each(ids, function(k, v) {
							if(methodInfo.verb.toLowerCase() === 'post' && k === ids.length-1 && !(v in methodSettings)) {
								requestSettings.data[v] = requestSettings.data.data.id;
							} else {
								requestSettings.data[v] = methodSettings[v];
								delete methodSettings[v];
							}
						});

						//These settings can not be overridden
						delete methodSettings.onRequestStart;
						delete methodSettings.onRequestEnd;
						delete methodSettings.onRequestSuccess;
						delete methodSettings.onRequestError;

						request($.extend({}, settings, methodSettings, requestSettings));
					}
				})
			});

			return sdkMethods;
		} else {
			throw('You must provide a valid apiRoot.');
		}
	};

	function authFunction(settings, defaultSettings, url) {
		var apiRoot = settings.apiRoot || defaultSettings.apiRoot;
		request($.extend({}, defaultSettings, {
			url: apiRoot + url,
			verb: 'PUT',
			data: {
				data: settings.data
			},
			success: function(data, status, jqXHR) {
				authTokens[apiRoot] = data.auth_token;
				settings.success && settings.success(data, status, jqXHR);
			},
			error: settings.error
		}));
	}

	function request(options) {
		var settings = {
				cache: options.cache || false,
				url: options.url,
				dataType: options.dataType || 'json',
				type: options.verb || 'get',
				contentType: options.type || 'application/json',
				processData: false,
				beforeSend: function(jqXHR, settings) {
					options.onRequestStart && options.onRequestStart();

					jqXHR.setRequestHeader('X-Auth-Token', options.authToken || authTokens[options.apiRoot]);
					$.each(options.headers || [], function(key, val) {
						jqXHR.setRequestHeader(key, val);
					});
				}
			},
			customFlags = {
				generateError: options.generateError === false ? false : true
			},
			mappedKeys = [],
			rurlData = /\{([^\}]+)\}/g,
			data = $.extend({}, options.data);

		// May not be needed with $.ajax
		// if(!settings.cache && settings.method.toLowerCase() === 'get') {
		// 	settings.url += (settings.url.indexOf('?') >= 0 ? '&' : '?') + '_=' + (new Date()).getTime();
		// }

		settings.error = function requestError (error) {
			options.onRequestEnd && options.onRequestEnd(error, customFlags);

			var parsedError = error;

			if('responseText' in error && error.responseText) {
				parsedError = $.parseJSON(error.responseText);
			}

			options.onRequestError && options.onRequestError(error, customFlags);

			options.error && options.error(parsedError, error);
		};

		settings.success = function requestSuccess(resp) {
			options.onRequestEnd && options.onRequestEnd(resp, customFlags);

			options.onRequestSuccess && options.onRequestSuccess(resp, customFlags);

			options.success && options.success(resp);
		};

		settings.url = settings.url.replace(rurlData, function (m, key) {
			if (key in data) {
				mappedKeys.push(key);
				return data[key];
			}
		});

		// We delete the keys later so duplicates are still replaced
		$.each(mappedKeys, function(index, name) {
			delete data[name];
		});

		if(settings.type.toLowerCase() !== 'get'){
			var postData = data.data;

			if(settings.contentType === 'application/json') {
				var payload = {
					data: data.data
				};

				if('uiMetadata' in options) {
					payload.data.ui_metadata = options.uiMetadata;
				}

				if(options.acceptCharges === true) {
					payload.accept_charges = true;
				}

				postData = JSON.stringify(payload);
			}

			settings = $.extend(settings, {
				data: postData
			});
		}

		return $.ajax(settings);
	}

}( jQuery ));