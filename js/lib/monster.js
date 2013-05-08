define(function(require){

	var $ = require("jquery"),
		_ = require("underscore"),
		postal = require("postal"),
		amplify = require("amplify"),
		handlebars = require("handlebars"),
		config = require("js/config");

	var monster = {

		_channel: postal.channel("monster"),

		// ping the server to see if a file exists. this is not an exhaustive or intensive operation.
		_fileExists: function(url){
	    var http = new XMLHttpRequest();
	    http.open("HEAD", url, false);
	    http.send();
	    return http.status != 404;
		},

		_loadApp: function(name, callback){

			var self = this,
				appPath = "apps/" + name,
				path = appPath + "/app",
				css = path + ".css";

			console.log("_loadApp", name, path);

			require([path], function(app){
				
				console.log("define:", path);

				_.extend(app, { appPath: '/' + appPath, data: {} });

				_.each(app.requests, function(request, id){
					self._defineRequest(id, request);
				});

				_.each(app.subscribe, function(callback, topic){
					var cb = typeof callback === "string" ? app[callback] : callback;

					self.sub(topic, cb, app);
				});

				_.extend(app.data, { i18n: {} });

				_.each(app.i18n, function(locale){
					self._loadLocale(app, locale)
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

		// adds the oauth headers and data
		_beforeRequest: function(xhr, settings) {
			xhr.setRequestHeader('X-Auth-Token', monster.config.user.authToken);

			if(typeof settings.data == 'object' && 'headers' in settings.data) {
				$.each(settings.data.headers, function(key, val) {
					switch(key) {
						case 'Content-Type':
							xhr.overrideMimeType(val);
							break;

						default:
							xhr.setRequestHeader(key, val);
					}
				});

				delete settings.data.headers;
			}

			if(settings.contentType == 'application/json') {
				if(settings.type == 'PUT' || settings.type == 'POST') {
					settings.data.verb = settings.type;
					settings.data = JSON.stringify(settings.data);
				}
				else if(settings.type =='GET' || settings.type == 'DELETE') {
					settings.data = '';
				}
			}
			else if(typeof settings.data == 'object' && settings.data.data) {
				settings.data = settings.data.data;
			}

			// Without returning true, our decoder will not run.
			return true;
		},

		_decodeRequest: function ( data, status, xhr, success, error ) {
			data = data || { status: "fail", message: "fatal" };

			if ( data.status === "success" ) {
				success( data.data );
			}
			else{
				var payload;

				try {
					payload = JSON.parse(ampXHR.responseText);
				}
				catch(e) {}

				if ( data.status === "fail" || data.status === "error" ) {
					error( payload || data.message, data.status );
				}
				else {
					error( payload || data.message , "fatal" );
				}
			}
		},

		_defineRequest: function(id, request){

			var self = this,
				settings = {
					//beforeSend: self._beforeRequest,
					cache: 'cache' in request ? request.cache : false,
					contentType: request.type || 'application/json',
					dataType: request.dataType || 'json',
					decoder: self._decodeRequest,
					headers: request.headers || {},
					processData: request.verb == 'GET',
					type: request.verb,
					url: self.config.api.default + request.url
				};

			amplify.request.define(id, 'ajax', settings);
		},

		apps: {},

		cache: {
			templates: {}
		},

		config: _.extend({}, config),

		css: function(href){
			$("<link/>", { rel: "stylesheet", href: href }).appendTo("head");
		},

		domain: function(){
			var matches = location.href.match(/^(?:https?:\/\/)*([^\/?#]+).*$/);
			return matches.length > 1 ? matches[1] : "";
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

		pub: function(topic, data){
			//this._channel.publish(topic, data || {});
			console.log('monster: publishing: ' + topic)
			postal.publish({
				channel: 'monster',
				topic: topic,
				data: data || {}
			});
		},

		querystring: function (key) {
			var re = new RegExp('(?:\\?|&)' + key + '=(.*?)(?=&|$)', 'gi');
			var results = [], match;
			while ((match = re.exec(document.location.search)) != null) results.push(match[1]);
			return results.length ? results[0] : null;
		},

		request: function(options){

			return amplify.request({
				resourceId: options.resource,
				data: options.data,
				success: function(data){
					options.success && options.success(data);
				},
				error: function(message, level){
					options.error && options.error(message, level);
				}				
			});			

		},

		sub: function(topic, callback, context){
			var sub = this._channel.subscribe(topic, callback);

			if(context){
				sub.withContext(context);
			}
		},

		shift: function(chain){
			var next = chain.shift();
			next && next();
		},	

		template: function(app, name, data, raw, ignoreCache){

			raw = raw || false;
			ignoreCache = ignoreCache || false;

			var conical = (this.name || "global") + "." + name, // this should always be a module instance
				_template,
				result;

			if(monster.cache.templates[conical] && !ignoreCache){
				_template = monster.cache.templates[conical];
			}
			else {

				// fetch template
				if($(name).length){ // template is in the dom. eg. <script type="text/html" />
					_template = $(name).html();
				}
				else if(name.substring(0, 1) === "!"){ // ! indicates that it's a string template
					_template = name.substring(1);
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

				if(data){
					var i18n = app.data.i18n[monster.config.i18n.active] || app.data.i18n['en-US'] || {};
						context = _.extend({}, data, { i18n: i18n });
					result = _template(context);
				}
			}
			else{
				result = _template;
			}

			result = result.replace(/(\r\n|\n|\r|\t)/gm,"");

			return result;
		}

	};

	return monster;
});
