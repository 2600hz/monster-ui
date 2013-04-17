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

				_.extend(app, { appPath: appPath });

				_.each(app.requests, function(request, id){
					self._defineRequest(id, request);
				});

				_.each(app.subscribe, function(topic, callback){
					var cb = typeof callback === "string" ? app[callback] : callback;

					self.sub(topic, cb, app);
				});

				if(self._fileExists(css)){
					self.css(css);
				}

				app.load(callback);
			})
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

		pub: function(topic, data){
			this._channel.publish(topic, data);
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

		template: function(name, data, raw, ignoreCache){

			raw = raw || false;
			ignoreCache = ignoreCache || false;

			var conical = (this.name || "global") + "." + name, // this should always be a module instance
				_template;

			if(cache.templates[conical] && !ignoreCache){
				return cache.templates[conical];
			}

			// fetch template
			if($(name).length){ // template is in the dom. eg. <script type="text/html" />
				_template = $(name).html();
			}
			else if(name.substring(0, 1) === "!"){ // ! indicates that it's a string template
				_template = name.substring(1);
			}
			else{
				// fetch via ajax
			}
			
			if(!raw){
				_template = handlebars.compile(template);
			}

			return _template;
		}

	};

	return monster;
});
