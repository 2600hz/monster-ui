define(function(require){
	var $ = require("jquery"),
		_ = require("underscore"),
		monster = require("monster");

	var app = {
		
		name: "core",
		
		i18n: [ 'en-US', 'fr-FR' ],

		requests: {
			"cors.test": {
				url: "phone_numbers?prefix=415&quantity=15",
				type: "text/plain",
				verb: "GET"
			}
		},
		
		subscribe: {
			"app.nav.add": function(data){
				console.log(data);
			},
			"app.nav.context.add": function(data){
				console.log(data);
			}
		},
	
		load: function(callback){
			
			var self = this;

			// monster.request({
			// 	resource: "cors.test",
			// 	data: { foo: "bar" },
			// 	success: function(data){
			// 		callback(self);
			// 	},
			// 	error: function(message, level){
			// 		console.log(message, level);
			// 		monster.config.companyName = "unknown";
			// 		callback(self);
			// 	}
			// })

			self.loadApps(callback);
		},

		render: function(callback){
			var self = this,
				template = monster.template(self, 'app', {});

			callback(template);
		},

		loadApps: function(callback){
			
			var self = this,
				apps = ['pbxs', 'myaccount', 'auth'], // FILO
				load = function(){
					if(!apps.length){
						callback(this);
						return;
					}

					var appName = apps.pop();
					monster._loadApp(appName, function(app){
						app.render(function(template){
							load();
						});
					});
				};

			load();
		}
		
	};

	return app;
});