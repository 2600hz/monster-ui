define(function(require){
	var $ = require("jquery"),
		_ = require("underscore"),
		monster = require("monster");

	var app = {
		
		name: "core",
		
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

			monster.request({
				resource: "cors.test",
				data: { foo: "bar" },
				success: function(data){
					console.log(data);
					callback(self);
				},
				error: function(message, level){
					console.log(message, level);
					monster.config.companyName = "unknown";
					callback(self);
				}
			})

		},

		loadApps: function(){

		}
		
	};

	return app;
});